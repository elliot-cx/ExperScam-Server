const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
    },
});

app.use(cors());

const questionRoomMap = {};
const playerUsedNames = [];

function generateUniqueName() {
    var randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    while (playerUsedNames.includes(randomName)) {
        randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    }
    playerUsedNames.push(randomName);
    return randomName;
}

io.on('connection', (socket) => {

    // Quand l'utilisateur vient de connecter on voit si il a déjà un nom
    socket.on('init', (name, callback) => {
        var returnName = name;
        if (name == null) {
            returnName = generateUniqueName();
        }
        callback(returnName);
    });

    // When a user enter a question
    socket.on('question', (state) => {
        const currentQuestion = state.currentQuestion;
        socket.join(currentQuestion);
        const correctAnswers = questionRoomMap[currentQuestion];
        if (correctAnswers != null) {
            io.to(socket.id).emit('reveal', questionRoomMap[currentQuestion]);
        }
    });

    // when the user completed the current question
    socket.on('submit', (state) => {
        const currentQuestion = state.currentQuestion;
        socket.leave(currentQuestion);
        const correctAnswers = state.correctAnswers;
        if (questionRoomMap[currentQuestion] == null) {
            console.log(`New answers : ${currentQuestion} : ${correctAnswers}`);
            questionRoomMap[currentQuestion] = correctAnswers;
            io.in(currentQuestion).emit('reveal',correctAnswers);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur en cours d'écoute sur le port ${PORT}`);
});
