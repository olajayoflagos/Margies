import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function CheckAvailability({ onCheck }) {
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!checkInDate || !checkOutDate) {
      alert("Please select both check-in and check-out dates.");
      return;
    }
    onCheck({ checkInDate, checkOutDate });
  };

  return (
    <div className="check-availability">
      <h2>Check Room Availability</h2>
      <form onSubmit={handleSubmit}>
        <label>Check-in Date:</label>
        <DatePicker
          selected={checkInDate}
          onChange={(date) => setCheckInDate(date)}
          selectsStart
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={new Date()}
          placeholderText="Select check-in date"
        />
<br></br><br></br>
        <label>Check-out Date:</label>
        <DatePicker
          selected={checkOutDate}
          onChange={(date) => setCheckOutDate(date)}
          selectsEnd
          startDate={checkInDate}
          endDate={checkOutDate}
          minDate={checkInDate || new Date()}
          placeholderText="Select check-out date"
        />
<br></br><br></br>
        <button  type="submit">Check Availability</button>
      </form>
    </div>
  );
}

export default CheckAvailability;
