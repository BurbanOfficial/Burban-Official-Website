// /api/webhook.js
const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const data = JSON.parse(event.body);

    // Vérifie si l'événement reçu est un changement de statut de commande (par exemple, "package_shipped")
    if (data.type === 'package_shipped') {
      const email = data.data.recipient.email; // L'email du client
      const orderId = data.data.order_id; // L'ID de la commande

      // Envoi de l'email via l'API Brevo (anciennement Sendinblue)
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          to: [{ email }],
          templateId: 12, // Remplace par l'ID de ton template Brevo
          params: { orderId }
        },
        {
          headers: {
            'api-key': 'VOTRE_API_KEY_BREVO',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook traité avec succès' }),
    };
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur interne' }),
    };
  }
};
