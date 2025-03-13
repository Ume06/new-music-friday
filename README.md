# New Music Friday Dev

This is an Express.js-based server for managing new music releases. Follow the steps below to set up and run the server.

## Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (version 14 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup

1. **Clone the repository** (if not already downloaded):
   ```sh
   git clone https://github.com/your-repo-link.git
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
    REDIRECT_URI=YOUR_REDIRECT_URI
    ```
## Running the Server

To start the Express server, use the following command:

```sh
node server.js
```

By default, the server should run on **http://localhost:8080/** (or another port if specified in the code).

## Project Structure

```
new-music-friday-dev/
│-- server.js          # Main Express server file
│-- package.json       # Project dependencies & scripts
│-- public/            # Frontend assets (HTML, CSS, JS)
│   ├── index.html     
│   ├── manage.html    
│   ├── style.css      
│   ├── app.js         
│-- music.json         # JSON data file for music releases
│-- .gitignore         # Git ignore rules
```

## License

This project is licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 Anus AI Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
