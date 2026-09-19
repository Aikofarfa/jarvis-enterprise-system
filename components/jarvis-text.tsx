import { StyleSheet, Text as NativeText, type TextProps } from "react-native";

type JarvisTextProps = TextProps & { className?: string };

export function JarvisText({ className, style, ...props }: JarvisTextProps) {
  return <NativeText {...props} className={className} style={[styles.base, style]} />;
}

const styles = StyleSheet.create({
  base: {
    color: "#edf2f7",
  },
});
