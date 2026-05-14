import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Top-level error boundary so any uncaught render errors surface as a visible
 * error screen instead of a silent white screen. Especially important in
 * production builds where you can't see the dev red-box.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app crashed during launch. Please share this with the developer.
          </Text>
          <View style={styles.box}>
            <Text style={styles.label}>Error:</Text>
            <Text style={styles.code} selectable>
              {this.state.error?.message ?? 'Unknown error'}
            </Text>
          </View>
          {this.state.error?.stack && (
            <View style={styles.box}>
              <Text style={styles.label}>Stack:</Text>
              <Text style={styles.code} selectable>
                {this.state.error.stack}
              </Text>
            </View>
          )}
          {this.state.errorInfo?.componentStack && (
            <View style={styles.box}>
              <Text style={styles.label}>Component stack:</Text>
              <Text style={styles.code} selectable>
                {this.state.errorInfo.componentStack}
              </Text>
            </View>
          )}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8EE' },
  content: { padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', color: '#7A2E0E', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B6B6B', marginBottom: 24, lineHeight: 20 },
  box: {
    backgroundColor: '#FFF1DE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C892',
  },
  label: { fontSize: 12, fontWeight: '700', color: '#7A2E0E', marginBottom: 6 },
  code: {
    fontSize: 11,
    color: '#3D2415',
    fontFamily: 'Menlo',
    lineHeight: 16,
  },
});
