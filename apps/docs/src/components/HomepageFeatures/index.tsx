/* eslint-disable @typescript-eslint/no-require-imports,unicorn/prefer-module */
import React, { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_easy_to_use.svg').default,
    description: (
      <>
        React Native Cloud Storage reduces much of the boilerplate when it comes to working with cloud storage providers
        such as iCloud and Google Drive.
      </>
    ),
  },
  {
    title: 'DX First',
    Svg: require('@site/static/img/undraw_dx.svg').default,
    description: (
      <>
        Developer experience is a top priority in our API design. All core functionality follows the conventions of
        Node.js's fs module.
      </>
    ),
  },
  {
    title: 'Works with Expo',
    Svg: require('@site/static/img/undraw_expo.svg').default,
    description: (
      <>
        The library fully supports Expo using a config plugin. No need to eject to a bare workflow or pure React Native.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, index) => (
            <Feature key={index} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
