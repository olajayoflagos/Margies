import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const q = query(collection(db, "messages"), orderBy("created", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(data);
    };

    fetchMessages();
  }, []);

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg.id}>
                <td>{msg.name}</td>
                <td>{msg.email}</td>
                <td>{msg.message}</td>
                <td>{msg.created?.toDate().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;
