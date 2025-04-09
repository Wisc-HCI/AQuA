const logToFile = async (componentName, action, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${componentName}: ${action} - ${details}\n`;

  try {
    const response = await fetch('http://127.0.0.1:5000/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        log_entry: logEntry
      })
    });

    if (!response.ok) {
      console.error('Failed to write to log file:', await response.text());
    }
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

export default logToFile; 