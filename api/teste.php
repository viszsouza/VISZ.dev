<?php
/**
 * Diagnóstico do salvamento de contatos — abra https://SEU-SITE/api/teste.php
 * Mostra, em português, o que está funcionando e o que falta. Não exibe senhas.
 * >>> APAGUE ESTE ARQUIVO depois de resolver. <<<
 */
define('VISZ_API', true);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$linhas = [];
$ok = true;
function item(string $titulo, bool $passou, string $detalhe = ''): void {
    global $linhas, $ok;
    if (!$passou) { $ok = false; }
    $linhas[] = [$passou, $titulo, $detalhe];
}

// 1. PHP
item('Versão do PHP', version_compare(PHP_VERSION, '7.4.0', '>='),
    'Seu servidor usa PHP ' . PHP_VERSION . '. Precisa ser 7.4 ou superior (ideal 8.1+). Altere em hPanel > Avançado > Configuração do PHP.');

// 2. extensões
item('Extensão pdo_mysql', extension_loaded('pdo_mysql'),
    'Necessária para falar com o MySQL. Ative em hPanel > Avançado > Configuração do PHP > Extensões.');
item('Extensão json', function_exists('json_encode'), '');

// 3. arquivos
item('Arquivo contato.php', is_file(__DIR__ . '/contato.php'), 'A pasta /api precisa estar no servidor junto com o site.');
item('Arquivo schema.sql', is_file(__DIR__ . '/schema.sql'), 'Usado para criar a tabela automaticamente.');

// 4. config
$cfg = null; $achado = '';
foreach ([dirname(__DIR__, 2) . '/visz-config.php' => 'fora da pasta pública (visz-config.php)', __DIR__ . '/config.php' => 'api/config.php'] as $arq => $nome) {
    if (@is_file($arq)) { $cfg = require $arq; $achado = $nome; break; }
}
item('Arquivo de configuração do banco', is_array($cfg), is_array($cfg) ? 'Encontrado em ' . $achado . '.' : 'Não encontrei api/config.php nem visz-config.php.');

// 5. conexão
$pdo = null;
if (is_array($cfg) && extension_loaded('pdo_mysql')) {
    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $cfg['db_host'], $cfg['db_name']),
            $cfg['db_user'], $cfg['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 6]
        );
        item('Conexão com o MySQL', true, 'Conectou ao banco ' . $cfg['db_name'] . '.');
    } catch (Throwable $e) {
        $codigo = (string)$e->getCode();
        $dica = [
            '1045' => 'Usuário ou senha incorretos. Confira em hPanel > Bancos de dados e atualize api/config.php.',
            '1044' => 'O usuário não tem permissão neste banco. Em Bancos de dados, associe o usuário ao banco com todos os privilégios.',
            '1049' => 'O banco informado não existe. Confira o nome em api/config.php.',
            '2002' => 'Servidor MySQL não encontrado. Tente trocar db_host de "localhost" para "127.0.0.1" em api/config.php.',
            '2006' => 'O servidor MySQL encerrou a conexão. Tente novamente em alguns minutos.',
        ][$codigo] ?? 'Código do erro: ' . $codigo . '. Veja o log de erros do PHP no hPanel.';
        item('Conexão com o MySQL', false, $dica);
    }
}

// 6. tabela e gravação
if ($pdo instanceof PDO) {
    try {
        $pdo->exec(file_get_contents(__DIR__ . '/schema.sql'));
        $total = (int)$pdo->query('SELECT COUNT(*) FROM contatos')->fetchColumn();
        item('Tabela "contatos"', true, 'Existe e tem ' . $total . ' contato(s) salvo(s).');

        $pdo->beginTransaction();
        $pdo->prepare("INSERT INTO contatos (nome,email,telefone,telefone_digitos,servico,mensagem) VALUES ('teste','teste@teste.com','(81) 90000-0000','5581900000000','teste','mensagem de teste do diagnóstico')")->execute();
        $pdo->rollBack();
        item('Gravar na tabela', true, 'O usuário consegue inserir registros (o teste foi desfeito, nada ficou salvo).');
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) { $pdo->rollBack(); }
        item('Tabela / gravação', false, 'Não consegui criar ou gravar na tabela (código ' . $e->getCode() . '). O usuário precisa ter permissão de CREATE e INSERT. Se preferir, rode api/schema.sql no phpMyAdmin.');
    }
}

// 7. rewrite/bloqueios: o endpoint responde?
$url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? '') . dirname($_SERVER['SCRIPT_NAME'] ?? '') . '/contato.php';

echo '<!DOCTYPE html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Diagnóstico dos contatos</title>';
echo '<style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#eee;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.5}h1{font-size:1.4rem}li{list-style:none;margin:10px 0;padding:12px 14px;border-radius:10px;background:#141414;border:1px solid #2a2a2a}b.ok{color:#5be37d}b.no{color:#ff6b6b}small{display:block;color:#aaa;margin-top:4px}.res{padding:14px;border-radius:10px;margin:18px 0;font-weight:600}.res.ok{background:#0f2a17;color:#8fffb0}.res.no{background:#2a1010;color:#ff9a9a}code{background:#222;padding:2px 6px;border-radius:4px}</style>';
echo '<h1>Diagnóstico dos contatos do site</h1><ul style="padding:0">';
foreach ($linhas as [$passou, $titulo, $detalhe]) {
    echo '<li><b class="' . ($passou ? 'ok' : 'no') . '">' . ($passou ? '✔' : '✘') . '</b> ' . htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');
    if ($detalhe !== '') { echo '<small>' . htmlspecialchars($detalhe, ENT_QUOTES, 'UTF-8') . '</small>'; }
    echo '</li>';
}
echo '</ul>';
echo $ok
    ? '<div class="res ok">Tudo certo: o site já consegue salvar os contatos. Envie um contato de teste pelo formulário e confira no phpMyAdmin.</div>'
    : '<div class="res no">Há itens para corrigir (marcados com ✘). Depois de ajustar, recarregue esta página.</div>';
echo '<p>Endereço do endpoint: <code>' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '</code></p>';
echo '<p><b>Importante:</b> apague o arquivo <code>api/teste.php</code> do servidor quando terminar.</p>';
