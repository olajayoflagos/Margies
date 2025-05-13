// BookingForm.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
// Import the new CSS file for BookingForm
import "./BookingForm.css";
// Ensure the booking service functions are imported
import { isRoomAvailable, bookRoomWithLinks, getUnavailableDates } from "./bookingService";

// Re-using room options definition for the select dropdown
const roomOptions = [
  { value: "apartment", label: "The Apartment" },
  { value: "diamond", label: "Room Diamond" },
  { value: "emerald", label: "Room Emerald" },
  { value: "onyx", label: "Room Onyx" },
  { value: "bronzite", label: "Room Bronzite" },
];


// Assuming this component might receive props like initialRoomId or initialDates
export default function BookingForm() {
  const [roomId, setRoomId] = useState(roomOptions[0].value); // Default to the first room
  // Using an array of dates for multiple selections, if that's the design
  // If it's always a range, the state could be { start: Date, end: Date }
  // Current DatePicker setup selects a range, so dates array seems intended for the range
  const [dates, setDates] = useState([]); // Array for [startDate, endDate]
  const [disabledDates, setDisabledDates] = useState([]); // Dates to disable in the picker
  const [status, setStatus] = useState(""); // To display booking status feedback
  const [isBooking, setIsBooking] = useState(false); // To show loading state

  // Load unavailable dates for the initially selected room
  useEffect(() => {
    async function loadDisabledDates() {
      try {
        // Fetch unavailable dates for the current room (and its linked rooms via service)
        const dates = await getUnavailableDates(roomId);
        // Convert string dates to Date objects required by DatePicker excludeDates prop
        const parsed = dates.map(dateStr => parseISO(dateStr));
        setDisabledDates(parsed);
      } catch (error) {
        console.error("Error loading disabled dates:", error);
        // Handle error loading dates if necessary
      }
    }

    loadDisabledDates();
     // Dependency array: re-run effect if roomId changes
  }, [roomId]);


  // Function to handle date range selection from the DatePicker
  const handleDateSelect = (dateRange) => {
      // DatePicker returns [startDate, endDate] for range selection
      setDates(dateRange);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dates.length === 0 || !dates[0] || !dates[1]) {
      setStatus("Please select a date range.");
      return;
    }
    const [startDate, endDate] = dates;

     if (startDate >= endDate) {
         setStatus("End date must be after start date.");
         return;
     }


    // Format dates for the booking service (exclusive of end date usually)
    const selectedDateStrings = [];
    let currentDate = new Date(startDate);
     while (currentDate < endDate) {
         selectedDateStrings.push(format(currentDate, "yyyy-MM-dd"));
         currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
     }
     // If booking includes the last night, add the end date too
     // selectedDateStrings.push(format(endDate, "yyyy-MM-dd"));


    setIsBooking(true); // Start loading
    setStatus("Checking availability...");

    try {
      // Check availability using the service function
      const available = await isRoomAvailable(roomId, selectedDateStrings);

      if (!available) {
        setStatus("Room or linked room already booked for these dates.");
        setIsBooking(false);
        return;
      }

      setStatus("Booking...");
      // Book the room using the service function
      await bookRoomWithLinks(roomId, selectedDateStrings);
      setStatus("Room booked successfully!");

      // Optional: Clear selected dates or update UI after successful booking
      setDates([]); // Clear selected range
      // You might want to trigger a reload of disabled dates here too
      const updatedDisabledDates = await getUnavailableDates(roomId);
      const parsed = updatedDisabledDates.map(dateStr => parseISO(dateStr));
      setDisabledDates(parsed);

    } catch (err) {
      setStatus("Error during booking.");
      console.error("Booking process failed:", err);
    } finally {
      setIsBooking(false); // End loading
    }
  };


  return (
    // Added a className to the main div
    <div className="booking-form-container">
      <h3>Book a Room</h3> {/* This will use themed h3 style */}
      <form onSubmit={handleSubmit} className="booking-form"> {/* Added form class */}

        <label htmlFor="room-select">Select Room:</label> {/* Added label htmlFor */}
        <select
          id="room-select" // Match label htmlFor
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          className="booking-form-select" // Added class
        >
          {roomOptions.map(room => (
            <option key={room.value} value={room.value}>{room.label}</option>
          ))}
        </select>

        <br />

        <label htmlFor="date-range-picker">Select Dates:</label> {/* Added label htmlFor */}
        <DatePicker
          id="date-range-picker" // Match label htmlFor
          selected={null} // DatePicker manages the range internally based on startDate/endDate props
          onChange={handleDateSelect} // Use the new handler
          startDate={dates[0]}
          endDate={dates[1]}
          selectsRange
          inline // Display inline calendar
          excludeDates={disabledDates} // Disable already booked dates
          minDate={new Date()} // Cannot book past dates
          dateFormat="yyyy-MM-dd" // Consistent format
        />

        <br />
        <button type="submit" className="booking-form-button" disabled={isBooking}>
           {isBooking ? "Processing..." : "Book Now"} {/* Button text based on loading state */}
        </button>
      </form>
      {/* Display the status message */}
      {status && <p>{status}</p>}
    </div>
  );
}
