const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/run', (req, res) => {
    const { language, code } = req.body;
    let command;

    if (language === "python") {
        command = `python -c "${code}"`;
    } else if (language === "php") {
        command = `php -r "${code}"`;
    } else if (language === "sql") {
        command = `sqlite3 mydatabase.db "${code}"`;
    }

    if (command) {
        exec(command, (error, stdout, stderr) => {
            res.json({ output: error ? stderr : stdout });
        });
    } else {
        res.json({ output: "Lenguaje no soportado en este servidor." });
    }
});

app.listen(3000, () => console.log("Servidor ejecutando en puerto 3000"));