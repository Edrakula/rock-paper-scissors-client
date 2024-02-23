import React, { useEffect, useState } from "react";
import logo from "./newImage1.png";
import "./App.css";

let socket = new WebSocket("ws://localhost:3001"); // WebSocket instance

const ChatApp = (messages, setMessages) => {
  // State to manage messages
  

  // Function to add a new message
  const addMessage = (text) => {
    socket.send(JSON.stringify({
      action: "send message",
      data: text
    }));
    
  };

  // Render the ChatApp component
  return (
    <div>
      <h1>Logs + Chat</h1>
      {/* Display messages */}
      <ChatMessages messages={messages} />
      {/* Input component to send messages */}
      <ChatInput addMessage={addMessage} />
    </div>
  );
};

const ChatInput = ({ addMessage }) => {
  // State to manage the input value
  const [input, setInput] = useState('');

  // Handler for input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Handler for sending a message
  const handleSendMessage = () => {
    if (input.trim() !== '') {
      addMessage(input);
      setInput('');
    }
  };

  // Render the ChatInput component
  return (
    <div>
      {/* Input field for typing messages */}
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Type a message..."
      />
      {/* Button to send a message */}
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

const ChatMessages = ({ messages }) => {
  // Render the ChatMessages component
  return (
    <ul>
      {/* Display messages in a list */}
      {messages.map((message, index) => (
        <li key={index}>{`${message.sender}: ${message.text}`}</li>
      ))}
    </ul>
  );
};


async function join(username, setClientId, setStarted, started, setGameFound, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen) {
  return fetch(`/api/join?username=${encodeURIComponent(username)}`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return Promise.reject("Join operation failed");
      }
    })
    .then((data) => {
      const clientId = data.clientId;

      console.log("Join successful, establishing WebSocket connection");
      
      console.log(clientId);

      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ type: 'subscribe', puuid: clientId }));
        console.log("WebSocket connection opened");
      });

      socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        console.log("Received from WebSocket:", data);

        if (data.type === 'uuid') {
          setClientId(data.puuid);
        } else if (data.type === 'match_found') {
          setGameFound(true);
          console.log(`Match found with opponent: ${data.opponent.username}`);
          // Handle other types of messages
        } else if (data.type === 'chat_message'){
          let messageGotten = data.message
          let user = data.user
          setMessages((prevMessages) => [...prevMessages, {text: messageGotten, sender: user}]);
        } else if (data.type === 'round-win'){
          setMessages((prevMessages) => [...prevMessages, {text: data.player + " " + data.data, sender: 'GAME'}]);
          setHasChosen(false);
        } else if (data.type === 'round_draw'){
          setMessages((prevMessages) => [...prevMessages, {text: "round draw. " + data.data, sender: 'GAME'}]);
          setHasChosen(false);
        } else if (data.type === 'move_declare'){
          setMessages((prevMessages) => [...prevMessages, {text: data.user + " declared a move", sender: 'GAME'}]);
        } else if (data.type === 'move_cancel'){
          setMessages((prevMessages) => [...prevMessages, {text: data.user + " cancelled their move", sender: 'GAME'}]);
        } else if (data.type ==='game-win'){
          setMessages((prevMessages) => [...prevMessages, {text: data.player + " " + data.data, sender: 'GAME'}]);
        }
      });

      socket.addEventListener("close", (event) => {
        console.log("WebSocket connection closed:", event);
        // Add your logic to handle the connection closure
      });
      
      socket.addEventListener("error", (event) => {
        console.error("WebSocket error:", event);
        // Add your logic to handle WebSocket errors
      });

    const joinMessage = {
        type: 'subscribe',  // Add a new action for join
        puuid: clientId
    };

    socket.send(JSON.stringify(joinMessage));
    setStarted(true);
    })
    .catch((error) => {
      console.error("Error joining:", error);
      return Promise.reject(error);
    });
}

function JoinBtn(setClientId, setStarted, started, setGameFound, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen) {
  const handleJoin = async () => {
    await join(document.getElementById('username').value, setClientId, setStarted, started, setGameFound, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen)
      .catch((error) => {
        console.error("Error during join:", error);
      });
  };

  return (
    <div>
      <button onClick={handleJoin}>Join</button>
    </div>
  );
}

function JoinScreen(data, setData, setClientId, setStarted, started, setGameFound, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen) {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{!data ? "Loading..." : data}</p>
        <input id="username" type="text" />
        {JoinBtn(setClientId, setStarted, started, setGameFound, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen)}
        
      </header>
    </div>
  );
}

function Game(gameFound, setGameFound, searching, setSearching, clientId, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen) {
  return (
      <div>
          {gameFound ? InGameScreen(messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen) : SearchForGameScreen(setGameFound, searching, setSearching, clientId)}
      </div>
  );
}

function StopSearchForGameButton(setSearching, clientId) {
  const StopSearchForGame = () => {
    setSearching(false);
    const searchMessage = {
      action: 'stop_search',
      uuid: clientId
    };
    socket.send(JSON.stringify(searchMessage));
    console.log('stop Searching for game...');
  };

  return (
    <button onClick={StopSearchForGame}>stop searching</button>
  );
}

function SearchForGameButton(setSearching, clientId) {
  const SearchForGame = () => {
    setSearching(true);
    const searchMessage = {
      action: 'start_search',
      uuid: clientId
    };
    socket.send(JSON.stringify(searchMessage));
    console.log('Searching for game...');
  };

  return (
    <button onClick={SearchForGame}>search for game</button>
  );
}

function SearchForGameScreen(setGameFound, searching, setSearching, clientId) {
  return (
    <div className="App">
      <header className="App-header">
        <p>joined</p>
        <p>{searching ? "searching" : "not searching"}</p>
        {searching? StopSearchForGameButton(setSearching, clientId) :SearchForGameButton(setSearching, clientId)}
      </header>
    </div>
  );
}

function InGameScreen(messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen) {
  const clickRock = () => {
    socket.send(JSON.stringify({
      action:"declare_move",
      move:"rock"
    }));

    setChosen("rock");
    setHasChosen(true);
  };

  const clickPaper = () => {
    socket.send(JSON.stringify({
      action:"declare_move",
      move:"paper"
    }));

    setChosen("paper");
    setHasChosen(true);

  };

  const clickScissors = () => {
    socket.send(JSON.stringify({
      action:"declare_move",
      move:"scissors"
    }));

    setChosen("scissors");
    setHasChosen(true);

  };

  const cancelClick = () => {
    socket.send(JSON.stringify({
      action:"cancel_move",
      
    }));

    setChosen(null);
    setHasChosen(false);

  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="grid">
          <div className="left">
            <p>{}vs{}</p>
            {hasChosenMove?<><p>You have chosen {chosenMove}</p><button onClick={cancelClick}>cancel</button></>:<><button onClick={clickRock}>rock</button><button onClick={clickPaper}>paper</button><button onClick={clickScissors}>scissors</button></>}
          </div>
          <div className="right">
            {ChatApp(messages, setMessages)}
          </div>
        </div>
      </header>
    </div>
  );
}

function App() {
  const [searching, setSearching] = useState(false);
  const [gameFound, setGameFound] = useState(false);
  const [data, setData] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [started, setStarted] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasChosenMove, setHasChosen] = useState(false);
  const [chosenMove, setChosen] = useState(null);
  const [name, setName] = useState(null);
  const [enemy, setEnemy] = useState(null);

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);

  return (
    <>
      {started ? Game(gameFound, setGameFound, searching, setSearching, clientId, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen) : JoinScreen(data, setData, setClientId, setStarted, started, setGameFound, messages, setMessages, hasChosenMove, setHasChosen, chosenMove, setChosen)}
    </>
  );
}

export default App;
