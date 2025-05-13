import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Your Firebase config
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
//import { PaystackPop } from '@paystack/inline-js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CheckAvailability.css'; // Use the responsive + styled version provided earlier

const CheckAvailability = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'rooms'));
        const availableRooms = [];
        querySnapshot.forEach(doc => {
          if (doc.data().available) {
            availableRooms.push({ id: doc.id, ...doc.data() });
          }
        });
        setRooms(availableRooms);
      } catch (err) {
        setErrorMsg('Failed to fetch rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableRooms();
  }, []);

  const handleBookNow = async () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedRoom || !guestEmail || !guestName || !checkIn || !checkOut) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      const roomData = selectedRoom;

      const bookingRef = await addDoc(collection(db, 'bookings'), {
        guestName,
        guestEmail,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        roomId: roomData.id,
        roomName: roomData.name,
        amountPaid: roomData.price,
        paymentMethod: 'Paystack - Card',
        status: 'Pending',
      });

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: 'your-paystack-public-key', // Replace with your Paystack key
        email: guestEmail,
        amount: roomData.price * 100,
        onSuccess: async (transaction) => {
          await updateDoc(doc(db, 'bookings', bookingRef.id), {
            paymentMethod: `Paystack - ${transaction.reference}`,
            status: 'Active',
          });

          await updateDoc(doc(db, 'rooms', roomData.id), {
            available: false,
          });

          setSuccessMsg('Payment successful & room booked!');
        },
        onCancel: () => {
          setErrorMsg('Payment cancelled');
        },
      });
    } catch (error) {
      console.error('Booking error:', error);
      setErrorMsg('An error occurred while booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="availability">
      <h2>Check Room Availability</h2>

      {loading && <div className="spinner"></div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <input
        type="text"
        placeholder="Your Full Name"
        value={guestName}
        onChange={e => setGuestName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Your Email Address"
        value={guestEmail}
        onChange={e => setGuestEmail(e.target.value)}
      />

      <div>
        <label>Check-In Date:</label>
        <DatePicker
          selected={checkIn}
          onChange={date => setCheckIn(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select check-in date"
          minDate={new Date()}
        />
      </div>

      <div>
        <label>Check-Out Date:</label>
        <DatePicker
          selected={checkOut}
          onChange={date => setCheckOut(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select check-out date"
          minDate={checkIn || new Date()}
        />
      </div>

      <select
        onChange={e => setSelectedRoom(JSON.parse(e.target.value))}
        defaultValue=""
      >
        <option value="" disabled>Select Available Room</option>
        {rooms.map(room => (
          <option key={room.id} value={JSON.stringify(room)}>
            {room.name} - ₦{room.price}
          </option>
        ))}
      </select>

      <button onClick={handleBookNow} disabled={loading}>
        {loading ? 'Processing...' : 'Book and Pay'}
      </button>
    </div>
  );
};

export default CheckAvailability;
