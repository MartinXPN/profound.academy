import {Component, ErrorInfo} from "react";
import {Typography} from "@mui/material";

class ErrorBoundary extends Component<{}, { error: Error | null }> {
    constructor(props: {}) {
        super(props);
        this.state = {error: null};
    }

    static getDerivedStateFromError(error: Error) {
        console.log('getDerivedStateFromError:', error);
        return {error: error};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error(error, errorInfo);
    }

    render() {
        // You can render any custom fallback UI
        if (this.state.error)
            return <>
                <Typography variant="h2" textAlign="center">Something went wrong</Typography>
                <Typography whiteSpace="pre-wrap" textAlign="center">{this.state.error.message}</Typography>
            </>

        return this.props.children;
    }
}

export default ErrorBoundary;
