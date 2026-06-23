async function reproduce() {
  const payload = {
    firstName: "John",
    lastName: "Doe",
    email: `john.doe.${Date.now()}@yopmail.com`,
    password: "SecurePassword123!",
    userType: "user" 
  };

  try {
    const response = await fetch("http://localhost:4000/v1/user/signup_with_password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", data);
  } catch (error) {
    console.error("Error hitting API:", error);
  }
}

reproduce();
