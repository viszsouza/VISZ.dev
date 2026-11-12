<?php
/**
 * Configuração do banco de dados — Agência VISZ.
 *
 * IMPORTANTE (segurança):
 *  - Este arquivo só pode ser lido pelo PHP, nunca pelo navegador (o .htaccess desta pasta bloqueia o acesso direto).
 *  - O ideal é MOVER este arquivo para FORA da pasta pública (public_html), uma pasta acima, com o nome
 *    "visz-config.php". O contato.php procura primeiro lá e só usa este se não achar.
 *  - Nunca copie estes dados para arquivos .js ou .html.
 */
if (!defined('VISZ_API')) { http_response_code(403); exit; }

return [
    'db_host' => 'localhost',            // na Hostinger o host do MySQL costuma ser "localhost"
    'db_name' => 'u175022134_contatos',
    'db_user' => 'u175022134_visz',
    'db_pass' => 'ContatosAgencia11',

    'rate_limit_por_hora' => 5,          // máximo de envios por IP por hora
    'termos_versao'       => '2026-11',  // versão dos Termos exibida no momento do aceite
];
