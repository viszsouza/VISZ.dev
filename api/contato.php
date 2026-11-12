<?php
/**
 * Recebe os contatos do formulário do site e grava no MySQL.
 * O envio para o WhatsApp acontece no navegador; este endpoint só guarda o registro.
 *
 * POST /api/contato.php  (JSON)  ->  { "ok": true, "id": 123 }
 */
declare(strict_types=1);
define('VISZ_API', true);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function responder(int $codigo, array $corpo) {
    http_response_code($codigo);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- método e origem ---------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, ['ok' => false, 'erro' => 'metodo']);
}

// aceita só requisições vindas do próprio site (barra envio direto de outros domínios)
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origem !== '') {
    $hostOrigem = parse_url($origem, PHP_URL_HOST) ?: '';
    $hostSite   = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
    $norm = function (string $h): string { return strtolower(preg_replace('/^www\./i', '', $h)); };
    if ($norm($hostOrigem) !== $norm($hostSite)) {
        responder(403, ['ok' => false, 'erro' => 'origem']);
    }
}

/* ---------- corpo da requisição ---------- */
$bruto = file_get_contents('php://input', false, null, 0, 20001);
if ($bruto === false || strlen($bruto) > 20000) {
    responder(413, ['ok' => false, 'erro' => 'tamanho']);
}
$dados = json_decode($bruto, true);
if (!is_array($dados)) { $dados = $_POST; }
if (!is_array($dados) || !$dados) {
    responder(400, ['ok' => false, 'erro' => 'corpo']);
}

/** tamanho em caracteres (funciona mesmo sem a extensão mbstring) */
function tamanho(string $v): int {
    return function_exists('mb_strlen') ? mb_strlen($v, 'UTF-8') : (int)preg_match_all('/./su', $v);
}

/** corta em N caracteres, sem quebrar acentos */
function cortar(string $v, int $max): string {
    if (function_exists('mb_substr')) { return mb_substr($v, 0, $max, 'UTF-8'); }
    return preg_match('/^.{0,' . $max . '}/su', $v, $m) ? $m[0] : '';
}

/** limpa texto: tira caracteres de controle, aplica trim e limite de tamanho */
function texto($v, int $max, bool $multilinha = false): string {
    $v = is_scalar($v) ? (string)$v : '';
    $v = preg_replace($multilinha ? '/[^\P{C}\n]+/u' : '/\p{C}+/u', '', $v) ?? '';
    $v = trim($v);
    return cortar($v, $max);
}

/* ---------- antispam silencioso (responde "ok" sem gravar) ---------- */
$armadilha = texto($dados['website'] ?? '', 100);          // campo escondido: humano não preenche
$tempoMs   = (int)($dados['tempo_ms'] ?? 0);                // tempo desde que a página abriu
if ($armadilha !== '' || $tempoMs < 1500) {
    responder(200, ['ok' => true]);
}

/* ---------- validação (espelha a do navegador) ---------- */
$nome     = texto($dados['name']    ?? '', 100);
$email    = strtolower(texto($dados['email'] ?? '', 120));
$telefone = texto($dados['phone']   ?? '', 20);
$servico  = texto($dados['service'] ?? '', 80);
$mensagem = texto($dados['message'] ?? '', 1000, true);

$erros = [];
if (tamanho(preg_replace('/[^\p{L}]/u', '', $nome) ?? '') < 2) { $erros['name'] = 'nome'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))                     { $erros['email'] = 'email'; }

$digitos = preg_replace('/\D/', '', $telefone) ?? '';
if (strlen($digitos) >= 12 && substr($digitos, 0, 2) === '55') { $digitos = substr($digitos, 2); }
$ddds = [11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,
         51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,
         91,92,93,94,95,96,97,98,99];
$foneOk = in_array(strlen($digitos), [10, 11], true)
    && in_array((int)substr($digitos, 0, 2), $ddds, true)
    && (strlen($digitos) === 10 || $digitos[2] === '9')
    && !preg_match('/^(\d)\1+$/', substr($digitos, 2));
if (!$foneOk)                                  { $erros['phone'] = 'telefone'; }
if ($servico === '')                           { $erros['service'] = 'servico'; }
if (tamanho($mensagem) < 10)                   { $erros['message'] = 'mensagem'; }

if ($erros) {
    responder(422, ['ok' => false, 'erro' => 'validacao', 'campos' => array_keys($erros)]);
}

/* ---------- dados técnicos e de origem (úteis para saber de onde vem cada lead) ---------- */
$ip     = substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
$ua     = texto($_SERVER['HTTP_USER_AGENT'] ?? '', 255);
$dispo  = preg_match('/Mobi|Android|iPhone|iPad/i', $ua) ? 'mobile' : 'desktop';
$utm    = is_array($dados['utm'] ?? null) ? $dados['utm'] : [];

/* ---------- configuração do banco ---------- */
$arquivosConfig = [dirname(__DIR__, 2) . '/visz-config.php', __DIR__ . '/config.php'];
$cfg = null;
foreach ($arquivosConfig as $arq) {
    if (is_file($arq)) { $cfg = require $arq; break; }
}
if (!is_array($cfg)) {
    error_log('[VISZ] config do banco não encontrada');
    responder(500, ['ok' => false, 'erro' => 'servidor']);
}

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $cfg['db_host'], $cfg['db_name']),
        $cfg['db_user'],
        $cfg['db_pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4, time_zone = '-03:00'",  // horário de Brasília
        ]
    );

    // cria a tabela na primeira execução (se ainda não existir)
    $pdo->exec(file_get_contents(__DIR__ . '/schema.sql'));

    // limite por IP: segura robôs e disparos repetidos
    $limite = (int)($cfg['rate_limit_por_hora'] ?? 5);
    $q = $pdo->prepare('SELECT COUNT(*) FROM contatos WHERE ip = ? AND criado_em > (NOW() - INTERVAL 1 HOUR)');
    $q->execute([$ip]);
    if ((int)$q->fetchColumn() >= $limite) {
        responder(429, ['ok' => false, 'erro' => 'limite']);
    }

    // evita duplicar o mesmo envio (clique duplo ou nova tentativa do navegador)
    $q = $pdo->prepare('SELECT id FROM contatos WHERE email = ? AND mensagem = ? AND criado_em > (NOW() - INTERVAL 10 MINUTE) LIMIT 1');
    $q->execute([$email, $mensagem]);
    if ($existente = $q->fetchColumn()) {
        responder(200, ['ok' => true, 'id' => (int)$existente]);
    }

    $ins = $pdo->prepare(
        'INSERT INTO contatos
           (nome, email, telefone, telefone_digitos, servico, mensagem, pagina_origem, referrer,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content, idioma, fuso,
            dispositivo, user_agent, ip, aceite_termos, termos_versao)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $ins->execute([
        $nome, $email, $telefone, '55' . $digitos, $servico, $mensagem,
        texto($dados['pagina']   ?? '', 255) ?: null,
        texto($dados['referrer'] ?? '', 255) ?: null,
        texto($utm['source']   ?? '', 100) ?: null,
        texto($utm['medium']   ?? '', 100) ?: null,
        texto($utm['campaign'] ?? '', 100) ?: null,
        texto($utm['term']     ?? '', 100) ?: null,
        texto($utm['content']  ?? '', 100) ?: null,
        texto($dados['idioma'] ?? '', 20) ?: null,
        texto($dados['fuso']   ?? '', 64) ?: null,
        $dispo, $ua ?: null, $ip ?: null,
        !empty($dados['aceite_termos']) ? 1 : 0,
        texto($dados['termos_versao'] ?? ($cfg['termos_versao'] ?? ''), 20) ?: null,
    ]);

    responder(200, ['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    // detalhes só no log do servidor — nunca vão para o navegador
    error_log('[VISZ] ' . get_class($e) . ': ' . $e->getMessage());
    responder(500, ['ok' => false, 'erro' => 'servidor']);
}
