<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
    exit;
}

if (!empty($_POST['website'])) {
    ob_end_clean();
    echo json_encode(['success' => true, 'message' => 'Message envoyé !']);
    exit;
}

$email   = trim(strip_tags($_POST['email']   ?? ''));
$subject = trim(strip_tags($_POST['subject'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));

$errors = [];
if (empty($email))                                   $errors[] = "L'email est requis.";
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL))  $errors[] = "L'email n'est pas valide.";
if (empty($message))                                 $errors[] = 'Le message est requis.';
if (strlen($message) > 5000)                         $errors[] = 'Le message est trop long (5000 caractères max).';

if (!empty($errors)) {
    ob_end_clean();
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

$to         = 'ciampone@ik.me';
$subjectRaw = $subject ?: 'Nouveau message depuis le portfolio';
$subjectEnc = '=?UTF-8?B?' . base64_encode($subjectRaw) . '?=';

$body  = "Email  : {$email}\n";
$body .= str_repeat('-', 30) . "\n\n";
$body .= $message;

$headers  = "From: Portfolio <noreply@basik-studio.ch>\r\n";
$headers .= "Reply-To: <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

ob_end_clean();

$sent = mail($to, $subjectEnc, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Message envoyé ! Je vous réponds rapidement.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "L'envoi a échoué. Écrivez directement à ciampone@ik.me"]);
}
