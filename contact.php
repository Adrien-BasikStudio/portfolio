<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Seules les requêtes POST sont acceptées
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
    exit;
}

// Honeypot anti-spam : si le champ "website" est rempli, on ignore silencieusement
if (!empty($_POST['website'])) {
    echo json_encode(['success' => true, 'message' => 'Message envoyé !']);
    exit;
}

// Récupération et nettoyage des champs
$email   = trim(strip_tags($_POST['email']   ?? ''));
$subject = trim(strip_tags($_POST['subject'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));

// Validation
$errors = [];
if (empty($email))                                   $errors[] = "L'email est requis.";
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL))  $errors[] = "L'email n'est pas valide.";
if (empty($message))                                 $errors[] = 'Le message est requis.';
if (strlen($message) > 5000)                         $errors[] = 'Le message est trop long (5000 caractères max).';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

$to      = 'ciampone@ik.me';
$subject = $subject ?: 'Nouveau message depuis le portfolio';
$subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$body  = "Email  : {$email}\n";
$body .= "---\n\n";
$body .= $message;

$headers  = "From: Portfolio <noreply@basik-studio.ch>\r\n";
$headers .= "Reply-To: <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Message envoyé ! Je vous réponds rapidement.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Une erreur s'est produite. Réessayez ou écrivez à ciampone@ik.me"]);
}
