const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
const db = admin.firestore();

async function checkServerAvailability(roomId, requestedStartDate, requestedEndDate) {
    if (!roomId || !requestedStartDate || !requestedEndDate) {
        console.error("checkServerAvailability: Missing input parameters.");
        return false;
    }

    const checkStartDate = requestedStartDate instanceof Date ? requestedStartDate : new Date(requestedStartDate);
    const checkEndDate = requestedEndDate instanceof Date ? requestedEndDate : new Date(requestedEndDate);

    if (isNaN(checkStartDate.getTime()) || isNaN(checkEndDate.getTime()) || checkEndDate <= checkStartDate) {
        console.error("checkServerAvailability: Invalid date range provided.");
        return false;
    }

    const startTimestamp = admin.firestore.Timestamp.fromDate(checkStartDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(checkEndDate);

    const availabilityRef = db.collection('rooms').doc(roomId).collection('availability');

    const querySnapshot1 = await availabilityRef
       .where('startDate', '<', endTimestamp)
       .get();

    const conflictingEntries = querySnapshot1.docs.filter(doc => {
       const entry = doc.data();
       const entryStartDate = entry.startDate instanceof admin.firestore.Timestamp ? entry.startDate.toDate() : new Date(entry.startDate);
       const entryEndDate = entry.endDate instanceof admin.firestore.Timestamp ? entry.endDate.toDate() : new Date(entry.endDate);

       const overlaps = entryStartDate < checkEndDate && entryEndDate > checkStartDate;

       return overlaps;
    });

    const isAvailable = conflictingEntries.length === 0;

    console.log(`Availability check for room ${roomId} (${checkStartDate.toISOString()} to ${checkEndDate.toISOString()}): Is available = ${isAvailable}`);

    return isAvailable;
}

exports.processNewBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const newBookingData = snap.data();
    const bookingId = context.params.bookingId;

    console.log(`Triggered: Processing new booking creation request ID: ${bookingId}`);
    console.log('Initial booking data from client:', newBookingData);

    if (!newBookingData.roomId || !newBookingData.startDate || !newBookingData.endDate || !newBookingData.userId) {
         console.error(`Booking request ${bookingId} is missing required fields (roomId, startDate, endDate, userId). Marking as invalid.`);
          try {
            await snap.ref.update({
              status: 'invalid_data',
              serverNotes: 'Missing required booking data fields'
            });
          } catch (updateErr) { console.error(`Error marking booking ${bookingId} as invalid:`, updateErr); }
         return null;
    }

    try {
      const isTrulyAvailable = await checkServerAvailability(newBookingData.roomId, newBookingData.startDate, newBookingData.endDate);

      if (!isTrulyAvailable) {
        console.error(`Server-side availability conflict detected for booking ${bookingId}. Marking as rejected.`);
        await snap.ref.update({
          status: 'rejected_conflict',
          serverNotes: 'Availability conflict detected during server processing'
        });
        return null;
      }
       console.log(`Server-side availability check passed for booking ${bookingId}. Proceeding.`);

      const bookingStartDate = newBookingData.startDate instanceof admin.firestore.Timestamp ? newBookingData.startDate : admin.firestore.Timestamp.fromDate(new Date(newBookingData.startDate));
      const bookingEndDate = newBookingData.endDate instanceof admin.firestore.Timestamp ? newBookingData.endDate : admin.firestore.Timestamp.fromDate(new Date(newBookingData.endDate));

      await db.collection('rooms').doc(newBookingData.roomId).collection('availability').add({
         bookingId: bookingId,
         startDate: bookingStartDate,
         endDate: bookingEndDate,
         status: 'booked',
         createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Added availability entry for room ${newBookingData.roomId} linked to booking ${bookingId}.`);

      await snap.ref.update({
        status: 'confirmed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Booking ${bookingId} marked as confirmed.`);

      console.log(`Successfully processed booking ${bookingId}.`);

      return null;

    } catch (error) {
       console.error(`FATAL Error processing booking ${bookingId}:`, error);
       try {
         await snap.ref.update({
           status: 'processing_failed',
           serverNotes: `Error during processing: ${error.message || 'Unknown error'}`,
           processedAt: admin.firestore.FieldValue.serverTimestamp(),
            errorMessage: error.message,
            errorStack: error.stack,
         });
         console.log(`Booking ${bookingId} marked as processing_failed.`);
       } catch (updateError) {
         console.error(`SEVERE Error updating booking ${bookingId} status to failed:`, updateError);
       }

       throw error;
    }
  });

exports.checkAvailability = functions.https.onCall(async (data, context) => {
  const { roomId, startDate, endDate } = data;

  console.log(`Callable function 'checkAvailability' called for room ${roomId} from ${startDate} to ${endDate}`);

  if (!roomId || !startDate || !endDate) {
    console.error("Invalid input for checkAvailability: Missing room ID or dates.");
    throw new functions.https.HttpsError('invalid-argument', 'Missing required information for availability check.');
  }

  const checkStartDate = new Date(startDate);
  const checkEndDate = new Date(endDate);

  if (isNaN(checkStartDate.getTime()) || isNaN(checkEndDate.getTime()) || checkEndDate <= checkStartDate) {
      console.error("Invalid input for checkAvailability: Invalid date range.");
      throw new functions.https.HttpsError('invalid-argument', 'Invalid date range provided.');
  }

  try {
     console.log(`Performing detailed availability check for room ${roomId} between ${checkStartDate.toISOString()} and ${checkEndDate.toISOString()}`);

     const isAvailable = await checkServerAvailability(roomId, checkStartDate, checkEndDate);

     console.log(`Availability check complete for room ${roomId}. Is available: ${isAvailable}`);

     return { available: isAvailable };

  } catch (error) {
      console.error(`Error during checkAvailability for room ${roomId}:`, error);
      throw new functions.https.HttpsError('internal', 'Unable to perform availability check.', error.message);
  }
});

exports.fetchUserBookings = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    console.error("fetchUserBookings called by unauthenticated user.");
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required to fetch bookings.');
  }

  const userId = context.auth.uid;
  console.log(`Callable function 'fetchUserBookings' called by user: ${userId}`);

  try {
    const bookingsRef = db.collection('bookings');
    const q = bookingsRef.where('userId', '==', userId);

    const snapshot = await q.get();

    const userBookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${userBookings.length} bookings for user ${userId}.`);

    return userBookings;

  } catch (error) {
     console.error(`Error fetching bookings for user ${userId}:`, error);
     throw new functions.https.HttpsError('internal', 'Unable to fetch bookings.', error.message);
  }
});

exports.cancelBooking = functions.https.onCall(async (data, context) => {
  const { bookingId } = data;

  if (!context.auth) {
    console.error(`cancelBooking called by unauthenticated user for booking ${bookingId}.`);
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required to cancel booking.');
  }

  const userId = context.auth.uid;
  console.log(`Callable function 'cancelBooking' called by user ${userId} for booking ID: ${bookingId}`);

  if (!bookingId) {
    console.error("Invalid input for cancelBooking: Missing booking ID.");
    throw new functions.https.HttpsError('invalid-argument', 'Missing booking ID.');
  }

  const bookingRef = db.collection('bookings').doc(bookingId);

  try {
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      console.warn(`Booking ${bookingId} not found for cancellation.`);
      throw new functions.https.HttpsError('not-found', 'Booking not found.');
    }

    const bookingData = bookingSnap.data();

    if (bookingData.userId !== userId) {
      console.error(`User ${userId} attempted to cancel booking ${bookingId} which belongs to user ${bookingData.userId}.`);
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to cancel this booking.');
    }

    if (bookingData.status === 'cancelled') {
       console.warn(`Booking ${bookingId} is already cancelled.`);
        return { status: 'already_cancelled', message: 'This booking is already cancelled.' };
    }

    await bookingRef.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledBy: userId,
    });

    console.log(`Booking ${bookingId} successfully cancelled by user ${userId}.`);

    const availabilityRef = db.collection('rooms').doc(bookingData.roomId).collection('availability');
    const availabilityQuery = availabilityRef
       .where('bookingId', '==', bookingId); // Find availability entry linked to this booking

    const availabilitySnapshot = await availabilityQuery.get();
    if (!availabilitySnapshot.empty) {
       const availabilityDoc = availabilitySnapshot.docs[0];
       await availabilityDoc.ref.update({ status: 'cancelled' }); // Or delete: await availabilityDoc.ref.delete();
       console.log(`Updated availability status for room ${bookingData.roomId}.`);
    } else {
       console.warn(`No matching availability entry found for booking ${bookingId}.`);
    }

    return { status: 'success', message: 'Booking cancelled successfully.' };

  } catch (error) {
    console.error(`Error cancelling booking ${bookingId} by user ${userId}:`, error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'An error occurred while cancelling the booking.', error.message);
  }
});
