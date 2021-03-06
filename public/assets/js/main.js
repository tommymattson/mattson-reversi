function getIRIParameterValue(requestedKey) {
    let pageIRI = window.location.search.substring(1);
    let pageIRIVariables = pageIRI.split('&');
    for (let i = 0; i < pageIRIVariables.length; i++) {
        let data = pageIRIVariables[i].split('=');
        let key = data[0];
        let value = data[1];
        if (key === requestedKey) {
            return value;
        }
    }
    return null;
}

let username = decodeURI(getIRIParameterValue('username'));
if ((typeof username == 'undefined' || (username === null) || (username === "null") || (username === ""))) {
    username = "Anonymous_" + Math.floor(Math.random() * 1000);
}

let chatRoom = decodeURI(getIRIParameterValue('game_id'));
if ((typeof chatRoom == 'undefined' || (chatRoom === null) || (chatRoom === "null"))) {
    chatRoom = "Lobby";
}
/**
 * Set up the socket.io connection to the server
 */
let socket = io();
socket.on('log', function (array) {
    console.log.apply(console, array);
});


function makeInviteButton(socket_id) {
    let newHTML = "<button type='button' class='btn buttons btn-outline-primary'>Invite</button>";
    let newNode = $(newHTML);
    newNode.click(() => {
        let payload = {
            requested_user: socket_id
        }
        console.log('**** Client log message, sending \'invite\' command: ' + JSON.stringify(payload));
        socket.emit('invite', payload);
    });
    return newNode;
}

function makeInvitedButton(socket_id) {
    let newHTML = "<button type='button' class='btn buttons'>Invited</button>";
    let newNode = $(newHTML);
    newNode.click(() => {
        let payload = {
            requested_user: socket_id
        }
        console.log('**** Client log message, sending \'uninvite\' command: ' + JSON.stringify(payload));
        socket.emit('uninvite', payload);
    });
    return newNode;
}


function makePlayButton(socket_id) {
    let newHTML = "<button type='button' class='btn button2'>Play</button>";
    let newNode = $(newHTML);
    newNode.click(() => {
        let payload = {
            requested_user: socket_id
        }
        console.log('**** Client log message, sending \'game_start\' command: ' + JSON.stringify(payload));
        socket.emit('game_start', payload);
    });
    return newNode;
}


function makeStartGameButton() {
    let newHTML = "<button type='button' class='btn btn-danger button2'>Starting Game</button>";
    let newNode = $(newHTML);
    return newNode;
}


socket.on('invite_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode = makeInvitedButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
})


socket.on('invited', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode = makePlayButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
})


socket.on('uninvited', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode = makeInviteButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
})


socket.on('game_start_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newNode = makeStartGameButton();
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
    /** Jump to the game page */
    window.location.href = 'game.html?username=' + username + '&game_id=' + payload.game_id;
})


socket.on('join_room_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    /** If we are being notified of ourselves then ignore the message and return */
    if (payload.socket_id === socket.id) {
        return;
    }

    let domElements = $('.socket_' + payload.socket_id);
    /** If we are being repeat notified then return */
    if (domElements.length !== 0) {
        return;
    }

    /**
    <div class="row align-items-center">
        <div class="col text-end">
            Don
        </div>
        <div class="col text-end">
            <button type="button" class="btn btn-primary">Invite</button>
        </div>
    </div>
     */
    let nodeA = $("<div></div>");
    nodeA.addClass("row");
    nodeA.addClass("align-items-center");
    nodeA.addClass("sockets_" + payload.socket_id);
    nodeA.hide();

    let nodeB = $("<div></div>");
    nodeB.addClass("col");
    nodeB.addClass("text-end");
    nodeB.addClass("socket_" + payload.socket_id);
    nodeB.append('<h4>' + payload.username + '</h4>');

    let nodeC = $("<div></div>");
    nodeC.addClass("text-start");
    nodeC.addClass("col");
    nodeC.addClass("socket_" + payload.socket_id);
    let buttonC = makeInviteButton(payload.socket_id);
    nodeC.append(buttonC);

    nodeA.append(nodeB);
    nodeA.append(nodeC);

    $('#players').append(nodeA);
    nodeA.show("fade", 1000)

    /** Announcing in the chat that someone has arrived */
    let newHTML = '<p class=\'join_room_response\'>' + payload.username + ' joined the chatroom. There are ' + payload.count + ' users in this room</p>'
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
})

socket.on('player_disconnected', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }

    if (payload.socket_id === socket.id) {
        return;
    }

    let domElements = $('.socket_' + payload.socket_id);
    if (domElements.length != 0) {
        domElements.hide("fade", 500);
    }

    let newHTML = '<p class=\'left_room_response\'>' + payload.username + ' left the chatroom. There are ' + payload.count + ' users in this room</p>'
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
})

function sendChatMessage() {
    let request = {};
    request.room = chatRoom;
    request.username = username;
    request.message = $('#chatMessage').val();
    console.log('**** Client log message, sending \'send_chat_message\' command: ' + JSON.stringify(request));
    socket.emit('send_chat_message', request);
    $('#chatMessage').val("");
}


socket.on('send_chat_message_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }
    let newHTML = '<p class=\'chat_message\'><b>' + payload.username + '</b>:\t' + payload.message + '</p>'
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
})

let old_board = [
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
];

let my_color = "";
let interval_timer;

socket.on('game_update', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let board = payload.game.board;
    if ((typeof board == 'undefined') || (board) === null) {
        console.log('Server did not send a valid board to display');
        return;
    }

    /** Update my color */
    if (socket.id === payload.game.player_red.socket) {
        my_color = 'red';
    }
    else if (socket.id === payload.game.player_blue.socket) {
        my_color = 'blue';
    }
    else {
        window.location.href = 'lobby.html?username=' + username;
        return
    }

    if (my_color === 'red') {
        $("#my_color").html('<h3 id="my_color">Team Red</h3>');
    }
    else if (my_color === 'blue') {
        $("#my_color").html('<h3 id="my_color">Team Blue</h3>');
    }
    else {
        $("#my_color").html("<h3 id='my_color'>Team undefined</h3>");
    }

    if (payload.game.whose_turn === 'red') {
        $("#my_color").append("<h4>It is Red's turn</h4>");
    }
    else if (payload.game.whose_turn === 'blue') {
        $("#my_color").append("<h4>It is Blue's turn</h4>");
    }
    else {
        $("#my_color").append("<h4>No turn found</h4>");
    }


    let redsum = 0;
    let bluesum = 0;

    /** Animate changes to the board */
    for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 8; column++) {
            if (board[row][column] === 'r') {
                redsum++;
            }
            else if (board[row][column] === 'b') {
                bluesum++;
            }

            /** Check to see if the server changed any space on the board */
            if (old_board[row][column] !== board[row][column]) {
                let graphic = "";
                let altTag = "";
                if ((old_board[row][column] === '?') && (board[row][column] === ' ')) {
                    graphic = "empty.gif";
                    altTag = "empty space";
                }
                else if ((old_board[row][column] === '?') && (board[row][column] === 'r')) {
                    graphic = "empty_to_red.gif";
                    altTag = "red token";
                }
                else if ((old_board[row][column] === '?') && (board[row][column] === 'b')) {
                    graphic = "empty_to_blue.gif";
                    altTag = "blue token";
                }
                else if ((old_board[row][column] === ' ') && (board[row][column] === 'r')) {
                    graphic = "empty_to_red.gif";
                    altTag = "red token";
                }
                else if ((old_board[row][column] === ' ') && (board[row][column] === 'b')) {
                    graphic = "empty_to_blue.gif";
                    altTag = "blue token";
                }
                else if ((old_board[row][column] === 'r') && (board[row][column] === ' ')) {
                    graphic = "red_to_empty.gif";
                    altTag = "empty space";
                }
                else if ((old_board[row][column] === 'b') && (board[row][column] === ' ')) {
                    graphic = "blue_to_empty.gif";
                    altTag = "empty space";
                }
                else if ((old_board[row][column] === 'r') && (board[row][column] === 'b')) {
                    graphic = "red_to_blue.gif";
                    altTag = "blue space";
                }
                else if ((old_board[row][column] === 'b') && (board[row][column] === 'r')) {
                    graphic = "blue_to_red.gif";
                    altTag = "red space";
                }
                else {
                    graphic = "error.gif";
                    altTag = "error";
                }

                const t = Date.now();
                $('#' + row + '_' + column).html('<img class="img-fluid" src="assets/images/' + graphic + '?time=' + t + '" alt="' + altTag + '"/>');
            }
            
            /** Set up interactivity */
            $('#' + row + '_' + column).off('click');
            $('#' + row + '_' + column).removeClass('hovered_over');
            if (payload.game.whose_turn === my_color) {
                if (payload.game.legal_moves[row][column] === my_color.substring(0, 1)) {
                    $('#' + row + '_' + column).addClass('hovered_over');
                    $('#' + row + '_' + column).click(((r, c) => {
                        return (() => {
                            let payload = {
                                row: r,
                                column: c,
                                color: my_color
                            };
                            console.log('**** Client log message, sending \'play_token\' command: ' + JSON.stringify(payload));
                            socket.emit('play_token', payload);
                        });
                    })(row, column));
                }
            }
        }
    }

    clearInterval(interval_timer);
    interval_timer = setInterval(((last_time) => {
        return ( () => {
            let d = new Date();
            let elapse_m = d.getTime() -last_time;
            let minutes = Math.floor((elapse_m/1000)/60);
            let seconds = Math.floor((elapse_m % (60*1000))/1000)
            let total = minutes * 60 + seconds;
            let timestring = ""+seconds;
            if (total > 100) {
                total = 100
            }
            $("#elapsed").css("width", total+"%").attr("aria-valuenow", total);
            timestring = timestring.padStart(2,'0');
            timestring = minutes+":"+timestring;
            if (total < 100) {
                $("#elapsed").html(timestring);
            }
            else {
                $("#elapsed").html("Times up!");
            }
        })
    })(payload.game.last_move_time), 1000);

    $('#redsum').html(redsum);
    $('#bluesum').html(bluesum);
    old_board = board;
})


socket.on('play_token_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        alert(payload.message);
        return;
    }
})


socket.on('game_over', (payload) => {
    if ((typeof payload == 'undefined') || (payload) === null) {
        console.log('Server did not send a payload');
        return;
    }
    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    /** Announce with a button to the lobby */
    let nodeA = $("<div id='game_over'></div>");
    let nodeB = $("<h1>Game Over</h1>");
    let nodeC = $("<h2>" + payload.who_won + " won!</h2>");
    let nodeD = $("<a href='lobby.html?username=" + username + "'class='btn buttons btn-lg role='button'>Return to Lobby</a>");

    nodeA.append(nodeB);
    nodeA.append(nodeC);
    nodeA.append(nodeD);
    nodeA.hide();
    $('#game_over').replaceWith(nodeA);
    nodeA.show('fade', 1000);
})


/**
 * Request to join the chat room
 */

$(() => {
    let request = {};
    request.room = chatRoom;
    request.username = username;
    console.log('**** Client log message, sending \'join_room\' command: ' + JSON.stringify(request));
    socket.emit('join_room', request);

    $('#lobbyTitle').html(username + "'s Lobby");
    $("#quit").html("<a href='lobby.html?username=" + username + "'class='btn buttons btn-lg role='button'>Return to Lobby</a>");

    $('#chatMessage').keypress(function (e) {
        let key = e.which;
        if (key == 13) {
            $('button[id = chatButton]').click();
            return false;
        }
    })
});
