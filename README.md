# Render Practice App

A deliberately small full-stack task board for learning Render deployment.

## What is included?

- **Frontend:** plain HTML, CSS, and browser JavaScript in `public/`
- **Backend:** Node.js + Express in `server.js`
- **Database:** PostgreSQL using the `pg` package
- **API:** list, create, complete/uncomplete, and delete tasks
- **Health check:** `GET /api/health`

The Express server also serves the frontend, so you can deploy this as **one Render Web Service** plus **one Render PostgreSQL database**. You do not need a separate Static Site for this starter.

## Run locally

Requirements: Node.js 20+ and PostgreSQL.

1. Create a PostgreSQL database named `render_practice`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your local connection string.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Set the environment variable in your terminal, or use a local environment-variable loader. For example, on Linux/macOS:

   ```bash
   export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/render_practice"
   npm start
   ```

5. Open `http://localhost:3000`.

The app creates the `tasks` table automatically on startup. Do not commit your `.env` file.

## Deploy on Render

### 1. Put the code on GitHub

Create a GitHub repository and push these files to its root. Make sure `package.json` and `server.js` are at the repository root.

### 2. Create a PostgreSQL database

In the Render dashboard:

1. Create a new **PostgreSQL** database.
2. Choose a region.
3. Wait until it is available.
4. Copy its **Internal Database URL** for use by a service in the same Render region. Use the External Database URL only when you need to connect from outside Render.

### 3. Create the web service

1. Create a new **Web Service** and connect your GitHub repository.
2. Use these settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free, if available for your account and region
3. In the service's **Environment** settings, add:
   - Key: `DATABASE_URL`
   - Value: the PostgreSQL database's **Internal Database URL**
4. Deploy the service.

The server listens on `process.env.PORT`, which Render provides. It binds to `0.0.0.0`, and it creates the database table at startup.

### 4. Test the deployment

Open your service's `onrender.com` URL. Try adding, completing, and deleting a task. Refresh the page: tasks should remain because they are stored in PostgreSQL.

You can also visit `/api/health` on the service URL. A healthy response looks like:

```json
{"status":"ok","database":"connected"}
```

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Check server/database connectivity |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task with JSON `{ "title": "Learn Render" }` |
| PATCH | `/api/tasks/:id` | Update completion with JSON `{ "completed": true }` |
| DELETE | `/api/tasks/:id` | Delete a task |

## If deployment fails

- Open **Render → your Web Service → Logs** and look for the first error.
- If logs say `DATABASE_URL is missing`, add it in the service's Environment settings.
- If database connections fail, verify the database is available and that the URL belongs to the database you created.
- Confirm the web service and database are in the same region when using the Internal Database URL.
- After changing environment variables, redeploy/restart the service if Render does not automatically do so.
- Do not put database credentials in frontend JavaScript. The browser should call `/api/...`; only the backend connects to PostgreSQL.

## Render concepts this project lets you practice

1. Git-based deployments and build/start commands
2. Environment variables and secrets
3. Web Service vs. PostgreSQL database
4. Build logs vs. runtime logs
5. Health-check endpoint and database connectivity
6. Persistent storage: app data lives in PostgreSQL, not in the server's filesystem
