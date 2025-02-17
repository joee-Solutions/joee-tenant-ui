import React from "react"

function AuthLayout ({children}: any){
    const backgroundStyles: React.CSSProperties = {
      background: `url('/assets/auth/authbg.jpeg')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };

    return (
      <main
        className="w-full min-h-[100vh] grid place-items-center p-5 md:p-8"
        style={backgroundStyles}
      >
        <div className="auth-container w-full max-w-[480px] md:max-w-[950px] rounded-lg bg-white px-5 md:px-8 py-8 flex flex-col place-items-center shadow-lg">
            {children}
            <p className="footer">footer</p>
        </div>
      </main>
    );
}