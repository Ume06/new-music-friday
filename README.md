# New Music Friday Dev

This is an Express.js-based server for managing new music releases. Follow the steps below to set up and run the server.

## Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (version 14 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup

1. **Clone the repository** (if not already downloaded):

   ```sh
   git clone https://github.com/ume-06/new-music-friday.git
   cd new-music-friday-dev
   ```

2. **Install dependencies**:

   ```sh
   npm install
   ```

3. **Define environment variable**:

    Use The Spotify developer dashboard to [create an application](https://developer.spotify.com/documentation/web-api/tutorials/getting-started#create-an-app) and get the client_id and client_secret, and configure the callback uri(s) for the project. Define them in the environment as follows:

    ```env
    CLIENT_ID=YOUR_CLIENT_SECRET
    CLIENT_SECRET=YOUR_CLIENT_ID
    ADDRESS=YOUR_ADDRESS # Not reqauired
    ```

## Running the Server

To start the Express server, use the following command:

```sh
node server.js
```

By default, the server should run on **<http://localhost:80/>** (or another port if specified in the code).

## Updating Music

The music displayed on the application can be modified from either the [music](music.json) file, or by using the
```/update``` endpoint. Copy the track or album share URL and either add a new entry in the music file, or add it
to the file by copying it into the provided box and pressing "Add Music"

## Project Structure

```languages.yml
new-music-friday-dev/
│-- server.js                       # Main Express server file
│-- package.json                    # Project dependencies & scripts
│-- public/                         # Frontend assets (HTML, CSS, JS)
│   ├── index.html     
│   ├── update.html    
│   ├── style.css      
|   ├── update.css
│   ├── app.js   
|   ├── fonts/                      # Required fonts
|   |   ├── Gotham-Black.otf 
|   |   ├── Gotham-Bold.otf 
|   |   ├── Gotham-LightItalic.otf      
│-- music.json                      # JSON data file for music releases
│-- .gitignore                      # Git ignore rules
|-- .env                            # Environment variables
```

## License

This project is licensed under the [Apache License](http://www.apache.org/licenses/LICENSE-2.0).
