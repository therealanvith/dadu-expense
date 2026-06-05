"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSignup, setIsSignup] = useState(false)

    async function handleSubmit(){
       if (isSignup) {
            const { error } = await supabase.auth.signUp({ email, password })
            if (error) { alert(error.message); return }
            alert("Account created! Please sign in.")
            setIsSignup(false)
        } else {
            await signIn("credentials", { email, password, callbackUrl: "/dashboard" })
        }
    }

    return(
        <div>
            <h1>{isSignup ? "Sign Up" : "Login"}</h1>
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
            <button onClick={handleSubmit}>{isSignup? "Sign Up":"Login"}</button>
            <button onClick={() => setIsSignup(!isSignup)}>
                {isSignup ? "Already have an account? Login" : "No account? Sign Up"}
            </button>
            <button onClick={() => signIn("google", {callbackUrl: "/dashboard"})}>
                Sign in with Google
            </button>
        </div>
    )
}