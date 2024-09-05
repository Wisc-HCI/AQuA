function Button() {
    // Asynchronous function to handle the script running logic
    // It uses the Fetch API to send a POST request to the backend
    const runScript = async () => {
        try {
            // Send a POST request to the backend endpoint 'http://localhost:5000/run-script'
            const response = await fetch('http://localhost:5000/run-script', {
                method: 'POST', // Specifies the HTTP method as POST
                headers: {
                    'Content-Type': 'application/json', // Sets the request's content type to JSON format
                },
                body: JSON.stringify({}), // The body of the request (currently an empty object)
                // If your backend expects data here, modify the body to include the appropriate payload
            });

            // Parse the response from the backend as JSON
            const data = await response.json();

            // Log the response data to the console (useful for debugging purposes)
            console.log(data);

            // Check if the response contains an error
            if (data.error) {
                // If an error is present, display an alert with the error message
                alert(`Error: ${data.error}`);
            } else {
                // If no error is present, display the output in an alert
                alert(`Output: ${data.output}`);
            }
        } catch (error) {
            // Catch any errors that occur during the fetch or response parsing
            console.error('Error:', error);
            // Display a generic error message in an alert if something goes wrong
            alert('An error occurred while running the script.');
        }
    };

    // Render the component's JSX
    // It contains a button that, when clicked, triggers the runScript function
    return (
        <div className="button-container">
            {/* Button element that calls runScript when clicked */}
            <button onClick={runScript}>new Button</button>
        </div>
    );
}

// Export the Button component to be used in other parts of the application
export default Button;