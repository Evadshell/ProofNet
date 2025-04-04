/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"
import { useState, useEffect } from "react";
import { useProgram } from "@/components/setup";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { DebugContract } from "@/components/debug-contract";

export default function Home() {
    const { program, provider } = useProgram();
    const wallet = useWallet();
    const [sessionId, setSessionId] = useState("");
    const [verifySessionId, setVerifySessionId] = useState("");
    
    // State for fetched data
    const [users, setUsers] = useState<any[]>([]);
    const [verifications, setVerifications] = useState<any[]>([]);

    const addUser = async () => {
        if (!program || !wallet.publicKey) return;
        try {
            const userKeypair = anchor.web3.Keypair.generate();
            
            const tx = await program.methods.addUser(sessionId).accounts({
                user: userKeypair.publicKey,
                signer: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId
            }).signers([userKeypair]).rpc();
            
            console.log("User added: ", tx);
            // Refetch users after adding
            fetchUsers();
        } catch (error) {
            console.error("Error adding user: ", error);
        }
    };

    const verifyUser = async () => {
        if (!program || !wallet.publicKey) return;
        try {
            const verificationKeypair = anchor.web3.Keypair.generate();
            
            const tx = await program.methods.addVerification(
                wallet.publicKey.toBase58(),
                verifySessionId,
                new anchor.BN(Date.now()),
                "accepted"
            ).accounts({
                verification: verificationKeypair.publicKey,
                signer: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId
            }).signers([verificationKeypair]).rpc();
            
            console.log("User verified: ", tx);
            // Refetch verifications after adding
            fetchVerifications();
        } catch (error) {
            console.error("Error verifying user: ", error);
        }
    };

    // Fetch all users
    const fetchUsers = async () => {
        if (!program) return;
        try {
            // Fetch all User accounts
            const fetchedUsers = await (program.account as any).user.all();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching users: ", error);
        }
    };

    // Fetch all verifications
    const fetchVerifications = async () => {
        if (!program) return;
        try {
            // Fetch all Verification accounts
            const fetchedVerifications = await (program.account as any).verification.all();
            setVerifications(fetchedVerifications);
        } catch (error) {
            console.error("Error fetching verifications: ", error);
        }
    };

    // Fetch data on component mount and when program is ready
    useEffect(() => {
        if (program) {
            fetchUsers();
            fetchVerifications();
        }
    }, [program]);

    return (
        <div className="flex flex-col items-center p-10">
            <h1 className="text-2xl font-bold">Buffalu Verification System</h1>
            
            {/* User Creation Section */}
            <div className="my-4">
                <Input 
                    type="text" 
                    placeholder="Enter Session ID" 
                    value={sessionId} 
                    onChange={(e) => setSessionId(e.target.value)} 
                />
                <Button className="mt-2" onClick={addUser}>Add User</Button>
            </div>

            {/* Verification Section */}
            <div className="my-4">
                <Input 
                    type="text" 
                    placeholder="Verify Session ID" 
                    value={verifySessionId}
                    onChange={(e) => setVerifySessionId(e.target.value)}
                />
                <Button className="mt-2" onClick={verifyUser}>Verify User</Button>
            </div>

            {/* Users Display */}
            <div className="mt-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Users</h2>
                {users.map((user, index) => (
                    <div key={index} className="border p-3 mb-2 rounded">
                        <p>Session ID: {user.account.clientSessionId}</p>
                        <p>Verified: {user.account.isVerified ? 'Yes' : 'No'}</p>
                    </div>
                ))}
            </div>

            {/* Verifications Display */}
            <div className="mt-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Verifications</h2>
                {verifications.map((verification, index) => (
                    <div key={index} className="border p-3 mb-2 rounded">
                        <p>Verified By: {verification.account.verifiedBy}</p>
                        <p>Target Session ID: {verification.account.targetedSessionId}</p>
                        <p>Status: {verification.account.status}</p>
                        <p>Timestamp: {new Date(Number(verification.account.timestamp)).toLocaleString()}</p>
                    </div>
                ))}
            </div>
            <DebugContract />
        </div>
    );
}