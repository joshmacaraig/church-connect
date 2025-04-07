# Church Connect

A social media app for Christians with worship team and calendar management features. This mobile-first application serves as a platform for church communities to organize worship services, plan events, and share prayer requests.

## Status

Currently deploying with GitHub Pages.

## Main Features

- **Authentication**: User registration, login, and profile management
- **Calendar Management**: Create and manage monthly/quarterly/yearly schedules for services
- **Worship Team Tools**: Music selection, service planning, and team coordination
- **Prayer Requests**: Share and respond to prayer needs within the community

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: TailwindCSS
- **Routing**: React Router

## Project Structure

- `/docs` - Setup and development guides
- `/src` - Frontend React application
- `/supabase` - Supabase configuration and schema

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/church-connect.git
cd church-connect
npm install
```

### 2. Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project and note your project URL and anon key
3. Copy `.env.example` to `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Set up your database tables following the instructions in [Backend Setup Guide](./docs/BACKEND.md)

### 3. Start Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:3000`

### 4. Building for Production

```bash
npm run build
```

## Detailed Documentation

For detailed setup and development information, see:

- [Supabase Setup Guide](./docs/SUPABASE_SETUP.md)
- [Claude Project Setup](./docs/CLAUDE_PROJECT_SETUP.md)

## Deployment

The application is deployed at: [https://joshmacaraig.com/church-connect/](https://joshmacaraig.com/church-connect/)

### Deploying to GitHub Pages

To deploy the application to GitHub Pages, run:

```bash
npm run deploy
```

Alternatively, pushing to the main branch will trigger an automatic deployment via GitHub Actions.

## Development Roadmap

1. **Phase 1**: Project Setup & Authentication
2. **Phase 2**: Calendar Management (prioritized feature)
3. **Phase 3**: Worship Team Management
4. **Phase 4**: Prayer Request System
5. **Phase 5**: Social Features

## Troubleshooting

### Missing Supabase environment variables

If you see `"Missing Supabase environment variables"` error:
1. Ensure you've created a `.env` file in the project root
2. Make sure it contains the correct Supabase URL and anon key
3. Restart the development server after making changes to `.env`

### Authentication errors

When testing without Supabase credentials, the app will run in development mode with mock authentication. To use real authentication, you must set up your Supabase project properly.

## Contributing

Please read our [Contributing Guide](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
