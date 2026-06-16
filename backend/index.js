import api from "./app.js";

const PORT = process.env.PORT || 3013;
api.listen(PORT, () => {
    console.log(`API G13 - Autorização rodando na porta ${PORT}...`);
});
