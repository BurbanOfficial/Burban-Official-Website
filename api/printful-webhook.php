<?php
// Fichier : /api/printful-webhook.php

// Récupère le contenu brut de la requête POST (Printful envoie du JSON)
$payload = file_get_contents("php://input");
$data = json_decode($payload, true);

// Pour les logs (utile pour voir ce que Printful envoie)
file_put_contents("webhook-log.txt", print_r($data, true), FILE_APPEND);

// Exemple : si une commande a été mise à jour ou expédiée
if (isset($data['type'])) {
    if ($data['type'] === 'order_updated') {
        // Ici tu peux connecter à Brevo pour envoyer un mail
    }
    if ($data['type'] === 'package_shipped') {
        // Exemple : récupérer l’email du destinataire
        $email = $data['data']['recipient']['email'];
        $orderId = $data['data']['order_id'];

        // Ici tu pourrais appeler l’API de Brevo
    }
}

http_response_code(200); // On dit à Printful que tout s’est bien passé
