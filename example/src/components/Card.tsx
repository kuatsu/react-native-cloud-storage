import React from 'react';
import { StyleSheet, View, type ViewProps, Text } from 'react-native';

interface CardProps extends ViewProps {
  title?: string;
}
const Card: React.FC<CardProps> = ({ title, children, style, ...rest }) => {
  return (
    <View {...rest} style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default Card;
