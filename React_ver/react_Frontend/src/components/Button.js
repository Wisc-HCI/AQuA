function Button(){
    const runScript = async () => {
        try {
            const response = await fetch('http://localhost:5000/run-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}), // Add body if your backend expects any data
            });
            const data = await response.json();
            console.log(data);
            if (data.error) {
                alert(`Error: ${data.error}`);
            } else {
                alert(`Output: ${data.output}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while running the script.');
        }
    };

    return (
        <div className="button-container">
            
            <button onClick={runScript}>new Button</button>
            
        </div>
    );
}

export default Button;