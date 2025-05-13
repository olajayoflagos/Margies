// This file contains functions for interacting with booking-related data,
// primarily by initiating creation (allowed by client rules) or calling
// server-side functions for restricted operations (read, update, check availability).

// Import necessary Firebase client SDK modules
import { collection, addDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions'; // For calling server functions
import { getAuth } from "firebase/auth"; // Assuming you need user authentication info
import { app } from "./firebase"; // Import your initialized Firebase app instance

// Get the Firestore and Functions instances from the client app
const db = getFirestore(app);
const functions = getFunctions(app);
// Get the Auth instance (if needed for user-specific calls)
const auth = getAuth(app);

// --- Function to CREATE a booking INITIALLY from the client ---
// This is the only direct Firestore write allowed for bookings by your rules.
// A Cloud Function will process this creation afterwards.
/**
 * Initiates a new booking by creating a document in Firestore.
 * This is the first step; server-side processing completes the booking.
 * @param {object} bookingDetails - An object containing the booking details provided by the user (e.g., roomId, startDate, endDate, guestName, contactInfo).
 * @returns {Promise<string>} A promise that resolves with the ID of the new booking document upon successful creation request.
 */
export async function createBookingRequest(bookingDetails) {
  try {
    console.warn("Initiating booking creation request..."); // Using warn as per your config preference

    // Add the booking details to the 'bookings' collection.
    // Firestore security rules allow this client 'create' operation.
    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingDetails, // Spread the booking details from the client
      createdAt: serverTimestamp(), // Use server timestamp for accuracy
      // Add the user ID if the user is logged in - IMPORTANT for server-side verification!
      userId: auth.currentUser ? auth.currentUser.uid : null,
      // Set an initial status indicating it needs server processing
      status: "request_pending",
      // Add other client-provided fields...
    });

    console.warn(`Booking creation request sent for ID: ${docRef.id}`); // Using warn

    // Return the ID of the newly created document
    return docRef.id;

  } catch (error) {
    // Log the error before re-throwing
    console.error("Error sending booking creation request:", error); // Using error
    // Re-throw the error so the calling UI code can handle it
    throw error;
  }
}

// --- Function to CALL a server-side function to CHECK AVAILABILITY ---
// This must be done server-side because clients cannot read potentially sensitive availability data directly.
/**
 * Calls a server-side Cloud Function to check room availability for a specific period.
 * @param {object} checkDetails - Object containing room ID, start date, and end date.
 * @returns {Promise<boolean>} A promise that resolves with the availability status (true if available, false otherwise) returned by the server.
 */
export async function checkRoomAvailability(checkDetails) {
  console.warn("Calling server-side checkAvailability function..."); // Using warn

  // Get the callable function reference
  const checkAvailabilityCallable = httpsCallable(functions, 'checkAvailability');

  try {
    // Call the function with the checkDetails data.
    const result = await checkAvailabilityCallable(checkDetails);
    // The actual data returned by the Cloud Function is in result.data
    console.warn("Availability check result from server:", result.data); // Using warn

    // Assume the server returns a boolean { available: true/false }
    return result.data.available;

  } catch (error) {
    console.error("Error calling checkAvailability function:", error); // Using error
    // Throw the error so the calling UI code can handle communication errors
    throw error;
  }
}


// --- Function to CALL a server-side function to FETCH USER'S BOOKINGS ---
// This must be done server-side because clients cannot read the 'bookings' collection directly.
/**
 * Calls a server-side Cloud Function to fetch the current user's bookings.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of booking data objects returned by the server.
 */
export async function fetchUserBookings() {
   console.warn("Calling server-side fetchUserBookings function..."); // Using warn

   // Ensure user is logged in before attempting to call a protected function
   if (!auth.currentUser) {
      console.warn("User not logged in. Cannot fetch bookings."); // Using warn
      // You might want to throw an error or return a specific status
      throw new Error("Authentication required to fetch bookings.");
   }

   // Get the callable function reference
   const fetchMyBookingsCallable = httpsCallable(functions, 'fetchMyBookings');

   try {
     // Call the function. No data payload needed for this basic version,
     // but you could pass pagination or filter options in the object argument.
     const result = await fetchMyBookingsCallable({}); // Pass empty object if no data

     // The data from the server is in result.data
     // Assume the server returns an array of booking objects
     console.warn("Fetched bookings from server:", result.data); // Using warn
     return result.data;

   } catch (err) { // Using 'err' as per previous warning, logging before rethrowing
     console.error("Error calling fetchUserBookings function:", err); // Using error
     throw err; // Re-throw the error
   }
}

// --- Function to CALL a server-side function to CANCEL a booking ---
// This must be done server-side because clients cannot update/delete the 'bookings' collection directly.
/**
 * Calls a server-side Cloud Function to cancel a specific booking.
 * @param {string} bookingId - The ID of the booking to cancel.
 * @returns {Promise<object>} A promise that resolves with the result object returned by the server (e.g., success status).
 */
export async function cancelBooking(bookingId) {
  console.warn(`Calling server-side cancelBooking function for ID: ${bookingId}`); // Using warn

  // Ensure user is logged in before attempting to call a protected function
   if (!auth.currentUser) {
      console.warn("User not logged in. Cannot cancel booking."); // Using warn
      throw new Error("Authentication required to cancel booking.");
   }

  // Get the callable function reference
  const cancelBookingCallable = httpsCallable(functions, 'cancelBooking');

  try {
    // Call the function, passing the booking ID
    const result = await cancelBookingCallable({ bookingId: bookingId });

    console.warn("Booking cancellation result from server:", result.data); // Using warn
    return result.data; // Return the server's response

  } catch (error) {
    console.error("Error calling cancelBooking function:", error); // Using error
    throw error;
  }
}


// --- Add other client-side functions that call server functions as needed ---
// Example: Function to submit a message to a specific room (calls a server function)
// export async function sendMessage(roomId, messageText) { ... call httpsCallable('sendMessageToRoom', { roomId, messageText }) ... }

