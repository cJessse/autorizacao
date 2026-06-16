import api from "./app.js";

const PORT = 3013;
api.listen(PORT, () => {
    console.log(`API G13 - Autorização rodando na porta ${PORT}...`);
});
