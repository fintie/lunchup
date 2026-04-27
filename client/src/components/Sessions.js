import React, { useState, useEffect } from "react";
import axios from "axios";

function Sessions({ user }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `/api/projects/user/${user._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSessions(res.data);
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProjects();
    }, []);
    return (
        <div>
            <h1>Projects</h1>
            {loading ? <p>Loading...</p> : (
                sessions.map(session => (
                    <div key={session._id}>
                        <h3>{session.title}</h3>
                        <p>{session.status}</p>
                    </div>
                ))
            )}
        </div>
    );
}

export default Sessions;