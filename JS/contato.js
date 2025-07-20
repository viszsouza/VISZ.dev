// CONTATO LOADING
const buttonContato = document.querySelector("#button-contato");
const loader = document.querySelector(".loader");

document.querySelector('.part2-contato').addEventListener('submit', function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const tipoProjeto = document.getElementById('tipo_projeto').value;
    const telefone = document.getElementById('telefone').value.trim();

    // Verifica se todos os campos foram preenchidos
    if (!nome || !email || !tipoProjeto || !telefone) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Mostra o loader
    loader.style.display = "block";

    const message = `*Nome:* ${nome}\n*E-mail:* ${email}\n*Tipo de Projeto:* ${tipoProjeto}\n*Telefone:* ${telefone}`;
    const url = `https://api.whatsapp.com/send?phone=5581985742601&text=${encodeURIComponent(message)}`;

    // Aguarda 1 segundo para o loader aparecer, depois abre o WhatsApp
    setTimeout(() => {
        window.open(url, '_blank');
        loader.style.display = "none";
    }, 1000);
});