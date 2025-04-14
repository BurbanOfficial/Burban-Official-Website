<?php
$token = '6u2SDeQ36U7k7977f9yTdAkgW4EbYQgHsgNsqh6B'; // Remplace par ton vrai token
$webhookUrl = 'https://burbanofficial.com/api/printful-webhook.php'; // Ton URL

$data = [
    "url" => $webhookUrl,
    "types" => ["order_updated", "package_shipped"]
];

$ch = curl_init('https://api.printful.com/webhooks');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Code HTTP : " . $httpCode . "\n";
echo "Réponse : " . $response;
