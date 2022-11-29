import React, { createContext, ReactNode, useContext, useState } from "react";
import { io, Socket } from "socket.io-client";

export const SocketContext = createContext<Socket | undefined>(undefined);

export const useSocketContext = () => {
  return useContext(SocketContext);
};
const SocketContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState(
    io(process.env.NEXT_PUBLIC_SERVER_ROUTE as string)
  );

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export default SocketContextProvider;
