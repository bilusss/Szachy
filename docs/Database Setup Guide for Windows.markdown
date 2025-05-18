# Database Setup Guide for Windows 🗄️

This guide helps you set up a PostgreSQL database for our chess project on Windows. We’ll use the official PostgreSQL installer and pgAdmin (a GUI tool) for simplicity.

## Step 1: Install PostgreSQL
1. **Download the Installer**:
   - Go to [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).
   - Download the installer for PostgreSQL 14 (to match the project setup). Look for the “Windows x86-64” version unless you’re on an older 32-bit system.

2. **Run the Installer**:
   - Open the downloaded file (e.g., `postgresql-14.x.x-windows-x64.exe`).
   - Follow the setup wizard:
     - **Installation Directory**: Leave as default (e.g., `C:\Program Files\PostgreSQL\14`).
     - **Components**: Select `PostgreSQL Server`, `pgAdmin 4`, and `Command Line Tools`.
     - **Data Directory**: Leave as default (e.g., `C:\Program Files\PostgreSQL\14\data`).
     - **Password**: Set a superuser password to `postgres` (we’ll use this temporarily).
     - **Port**: Leave as `5432`.
     - Complete the installation.

3. **Verify Installation**:
   - Open the Start menu and search for `pgAdmin 4`.
   - Launch pgAdmin 4. It should open in your browser.
   - You’ll see a server named “PostgreSQL 14” in the left sidebar.

## Step 2: Create the Database and User with pgAdmin
1. **Connect to the Server**:
   - In pgAdmin, click on “PostgreSQL 14”.
   - Enter the password `postgres` (set during installation) to connect.

2. **Create the `admin` User**:
   - Right-click on “Login/Group Roles” in the left sidebar and select “Create > Login/Group Role”.
   - In the “General” tab:
     - Name: `admin`
   - In the “Definition” tab:
     - Password: `password`
   - In the “Privileges” tab:
     - Enable “Can login?” and “Create databases?”.
   - Click “Save”.

3. **Create the `szachy` Database**:
   - Right-click on “Databases” in the left sidebar and select “Create > Database”.
   - In the “General” tab:
     - Database: `szachy`
     - Owner: `admin`
   - Click “Save”.

## Step 3: Configure Authentication
1. **Locate the `pg_hba.conf` File**:
   - In pgAdmin, go to “PostgreSQL 14” > “Schemas” > “pg_catalog” > “Tables”.
   - Run a query to find the file:
     - Click “Tools” > “Query Tool”.
     - Run:
       ```sql
       SHOW hba_file;
       ```
     - It’s usually `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`.

2. **Edit the File**:
   - Open File Explorer and navigate to `C:\Program Files\PostgreSQL\14\data\`.
   - Open `pg_hba.conf` with Notepad (right-click > Open with > Notepad).
   - Find the line:
     ```
     local   all   all   peer
     ```
   - Change `peer` to `md5`:
     ```
     local   all   all   md5
     ```
   - Save the file (you might need to run Notepad as Administrator if you get a permission error).

3. **Restart PostgreSQL**:
   - Open the Start menu, search for “Services”, and open the Services app.
   - Find `postgresql-x64-14` in the list.
   - Right-click and select “Restart”.

## Step 4: Test the Connection
1. **Open Command Prompt**:
   - Press `Win + R`, type `cmd`, and press Enter.

2. **Test the Connection**:
   - Run:
     ```cmd
     psql -U admin -d szachy
     ```
   - Enter the password `password`.
   - If you see `szachy=#`, it worked! Exit with:
     ```sql
     \q
     ```

## Step 5: Create Tables
- In Command Prompt, navigate to the project directory and run:
  ```cmd
  psql -U admin -d szachy -f database\init.sql
  ```
  - Ensure `database\init.sql` exists in the project directory (it contains the `users` and `matches` tables).

## Troubleshooting
- **Permission Issues**: Run Notepad as Administrator to edit `pg_hba.conf`.
- **Connection Errors**: Ensure PostgreSQL is running in Services and the password matches (`password`).
- **Command Not Found**: Add PostgreSQL’s `bin` directory to your PATH:
  - Search for “Environment Variables” in the Start menu.
  - Edit the PATH variable and add: `C:\Program Files\PostgreSQL\14\bin`.

Your database is now ready! Run the server (`npm start` in `server/`) on port 5001 and the client (`npm start` in `client/`) to start playing chess! ♟️