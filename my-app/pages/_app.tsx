import "../styles/globals.css";
import type { AppProps } from "next/app";
import SocketContextProvider, {
  useSocketContext,
} from "../contexts/SocketProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SocketContextProvider>
      <Component {...pageProps} />
    </SocketContextProvider>
  );
}
