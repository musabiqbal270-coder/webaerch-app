# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running Locally

To run this application on your local machine, follow these steps:

1.  **Install Dependencies:**
    Open your terminal in the project's root directory and run the following command to install the necessary packages:
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    The application requires API keys to function correctly. You will need to have a `.env` file in the root of your project. I have already added your Tavily API key. You will also need to add your Gemini API key.

    Your `.env` file should look like this:

    ```
    TAVILY_API_KEY=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
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

    You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

3.  **Run the Development Server:**
    Once the dependencies are installed and your environment variables are set, you can start the Next.js development server. Run the following command:
    ```bash
    npm run dev
    ```
    This will start the application, typically on [http://localhost:9002](http://localhost:9002).

4.  **Run the Genkit Server (Optional but Recommended):**
    For AI-related features and debugging, it's helpful to run the Genkit server in a separate terminal window:
    ```bash
    npm run genkit:watch
    ```
    This will start the Genkit development UI, which you can usually access at [http://localhost:4000