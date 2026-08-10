import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const SectionWrapper = <P extends object>(
  Component: React.ComponentType<P>,
  idName?: string,
  extraClassName: string = ''
) => {
  return function HOC(props: P) {
    const { ref, isVisible } = useScrollReveal<HTMLElement>();

    return (
      <section
        ref={ref}
        id={idName}
        className={`sm:px-16 px-6 sm:py-16 py-10 max-w-7xl mx-auto relative z-0 reveal-element ${
          isVisible ? 'is-visible' : ''
        } ${extraClassName}`.trim()}
      >
        <Component {...props} />
      </section>
    );
  };
};

export default SectionWrapper;

