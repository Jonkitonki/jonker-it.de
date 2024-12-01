interface ContactFormPayload {
  name: string;
  email: string;
  message: string;
  recaptchaToken: string;
}

export async function sendContactForm(data: ContactFormPayload): Promise<void> {
  const response = await fetch('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Fehler beim Senden der Nachricht');
  }
}