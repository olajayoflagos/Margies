import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import './AdminDashboard.css';
import logo from "./assets/margies logo.jpg";

// PDF Receipt Component (now included inline)
const ReceiptPDF = ({ booking }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <img src={logo} alt="margies logo" className="logo" />
        <Text>Booking Receipt</Text>
      </View>
      <View style={styles.section}>
        <Text>Booking ID: {booking.id.slice(0, 8)}</Text>
        <Text>Room: {booking.roomName}</Text>
        <Text>Dates: {booking.checkIn} to {booking.checkOut}</Text>
        <Text>Guest: {booking.guestName}</Text>
        <Text>Email: {booking.guestEmail}</Text>
        <Text>Total Paid: NGN{booking.amountPaid}</Text>
        <Text>Status: {booking.status}</Text>
      </View>
    </Page>
  </Document>
);

// PDF Styles
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 10, lineHeight: 1.5 }
});

const AdminDashboard = () => {
  const [data, setData] = useState({
    messages: [],
    rooms: [],
    bookings: [],
    loading: true,
    error: null
  });

  const [activeTab, setActiveTab] = useState('messages');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [messagesRes, roomsRes, bookingsRes] = await Promise.all([
          getDocs(collection(db, 'messages')),
          getDocs(collection(db, 'rooms')),
          getDocs(query(collection(db, 'bookings'), where('status', '!=', 'cancelled')))
        ]);

        setData({
          messages: messagesRes.docs.map(d => ({ id: d.id, ...d.data() })),
          rooms: roomsRes.docs.map(d => ({ id: d.id, ...d.data() })),
          bookings: bookingsRes.docs.map(d => ({ id: d.id, ...d.data() })),
          loading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };

    fetchAllData();
  }, []);

  const handleRoomUpdate = async (roomId, updates) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), updates);
      setData(prev => ({
        ...prev,
        rooms: prev.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r)
      }));
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleBookingConfirm = async (bookingId) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'confirmed' });
      setData(prev => ({
        ...prev,
        bookings: prev.bookings.map(b => 
          b.id === bookingId ? { ...b, status: 'confirmed' } : b
        )
      }));
    } catch (err) {
      console.error("Confirmation failed:", err);
    }
  };

  const filteredMessages = data.messages.filter(msg =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = data.bookings.filter(booking =>
    booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.roomName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (data.loading) return <div className="loading">Loading dashboard...</div>;
  if (data.error) return <div className="error">Error: {data.error}</div>;

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Margie's Admin Dashboard</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <nav className="tabs">
        {['messages', 'rooms', 'bookings'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => {
              setActiveTab(tab);
              setSearchTerm('');
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'messages' && ` (${data.messages.length})`}
            {tab === 'bookings' && ` (${data.bookings.length})`}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === 'messages' && (
          <MessageTable 
            messages={filteredMessages} 
            onDelete={(id) => {
              deleteDoc(doc(db, 'messages', id));
              setData(prev => ({
                ...prev,
                messages: prev.messages.filter(m => m.id !== id)
              }));
            }}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomTable 
            rooms={data.rooms} 
            onUpdate={handleRoomUpdate} 
          />
        )}

        {activeTab === 'bookings' && (
          <BookingTable 
            bookings={filteredBookings} 
            onConfirm={handleBookingConfirm} 
          />
        )}
      </div>
    </div>
  );
};

// Sub-components for better organization
const MessageTable = ({ messages, onDelete }) => (
  <table className="data-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Message</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {messages.map((msg) => (
        <tr key={msg.id}>
          <td>{msg.name}</td>
          <td>{msg.email}</td>
          <td className="message-cell">{msg.message}</td>
          <td>{msg.created?.toDate().toLocaleString()}</td>
          <td>
            <button 
              className="delete-btn"
              onClick={() => onDelete(msg.id)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const RoomTable = ({ rooms, onUpdate }) => (
  <table className="data-table">
    <thead>
      <tr>
        <th>Room</th>
        <th>Type</th>
        <th>Price</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {rooms.map((room) => (
        <tr key={room.id}>
          <td>{room.name}</td>
          <td>{room.type}</td>
          <td>NGN{room.price}/day</td>
          <td>
            <span className={`status-badge ${room.available ? 'available' : 'booked'}`}>
              {room.available ? 'Available' : 'Booked'}
            </span>
          </td>
          <td>
            <button
              className={`toggle-btn ${room.available ? 'book' : 'unbook'}`}
              onClick={() => onUpdate(room.id, { available: !room.available })}
            >
              {room.available ? 'Mark Booked' : 'Make Available'}
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const BookingTable = ({ bookings, onConfirm }) => (
  <table className="data-table">
    <thead>
      <tr>
        <th>Booking ID</th>
        <th>Room</th>
        <th>Dates</th>
        <th>Guest</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Receipt</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {bookings.map((booking) => (
        <tr key={booking.id}>
          <td>{booking.id.slice(0, 8)}</td>
          <td>{booking.roomName}</td>
          <td>{booking.checkIn} to {booking.checkOut}</td>
          <td>{booking.guestName}</td>
          <td>NGN{booking.amountPaid}</td>
          <td>
            <span className={`status-badge ${booking.status}`}>
              {booking.status}
            </span>
          </td>
          <td>
            <PDFDownloadLink
              document={<ReceiptPDF booking={booking} />}
              fileName={`receipt_${booking.id}.pdf`}
              className="receipt-link"
            >
              {({ loading }) => loading ? 'Preparing...' : 'Download'}
            </PDFDownloadLink>
          </td>
          <td>
            {booking.status === 'pending' && (
              <button
                className="confirm-btn"
                onClick={() => onConfirm(booking.id)}
              >
                Confirm
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default AdminDashboard;