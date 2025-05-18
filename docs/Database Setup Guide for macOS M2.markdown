# Database Setup Guide for macOS M2 (Apple Silicon) 🗄️

This guide helps you set up a PostgreSQL database for our chess project on your Mac with an M2 chip. It’s straightforward and uses Homebrew for installation.

## Step 1: Install PostgreSQL
1. **Install Homebrew** (if not already installed):
   - Open Terminal and run:
     ```bash
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     ```
   - Follow the on-screen instructions to complete the installation.

2. **Install PostgreSQL**:
   - Install PostgreSQL version 14 (matching the project setup):
     ```bash
     brew install postgresql@14
     ```

3. **Start PostgreSQL**:
   - Start the PostgreSQL service:
     ```bash
     brew services start postgresql@14
     ```
   - Verify it’s running:
     ```bash
     brew services list
     ```
     - Look for `postgresql@14` with a `started` status.

## Step 2: Initialize the Database Cluster
1. **Create a Data Directory**:
   - On Apple Silicon, Homebrew uses `/opt/homebrew/`. Create the PostgreSQL data directory:
     ```bash
     sudo mkdir -p /opt/homebrew/var/postgresql@14
     sudo chown $(whoami):staff /opt/homebrew/var/postgresql@14
     ```

2. **Initialize the Database**:
   - Run the initialization command:
     ```bash
     initdb /opt/homebrew/var/postgresql@14
     ```
   - You should see a success message like:
     ```
     Success. You can now start the database server using: ...
     ```

## Step 3: Create the Database and User
1. **Connect to PostgreSQL**:
   - Connect using your macOS username:
     ```bash
     psql -U $(whoami) -d postgres
     ```

2. **Create the `admin` User**:
   - Inside the PostgreSQL prompt:
     ```sql
     CREATE ROLE admin WITH LOGIN PASSWORD 'password';
     ALTER ROLE admin CREATEDB;
     ```

3. **Create the `szachy` Database**:
   ```sql
   CREATE DATABASE szachy OWNER admin;
   ```
   - Exit the prompt:
     ```sql
     \q
     ```

## Step 4: Configure Authentication
1. **Locate the `pg_hba.conf` File**:
   - Find the file path:
     ```bash
     psql -U $(whoami) -t -P format=unaligned -c 'SHOW hba_file;'
     ```
   - It should be `/opt/homebrew/var/postgresql@14/pg_hba.conf`.

2. **Edit the File**:
   - Open the file:
     ```bash
     nano /opt/homebrew/var/postgresql@14/pg_hba.conf
     ```
   - Find the line:
     ```
     local   all   all   trust
     ```
   - Change `trust` to `md5`:
     ```
     local   all   all   md5
     ```
   - Save and exit (`Ctrl+X`, `Y`, `Enter`).

3. **Restart PostgreSQL**:
   - Apply the changes:
     ```bash
     brew services restart postgresql@14
     ```

## Step 5: Test the Connection
- Test the connection:
  ```bash
  psql -U admin -d szachy
  ```
  - Enter the password `password`.
  - If you see `szachy=#`, it worked!

## Step 6: Create Tables
- Run the SQL script to create tables:
  ```bash
  psql -U admin -d szachy -f database/init.sql
  ```
  - Ensure `database/init.sql` exists in the project directory (it contains the `users` and `matches` tables).

## Troubleshooting
- **Permission Issues**: Use `sudo` if you can’t create directories.
- **Connection Errors**: Ensure PostgreSQL is running (`brew services list`) and the password matches (`password`).
- **Path Issues**: Confirm the path matches `/opt/homebrew/` for Apple Silicon.

Your database is now ready! Run the server (`npm start` in `server/`) on port 5001 and the client (`npm start` in `client/`) to start playing chess! ♟️