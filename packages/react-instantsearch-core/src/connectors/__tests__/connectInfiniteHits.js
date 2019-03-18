import connect from '../connectInfiniteHits';

jest.mock('../../core/createConnector', () => x => x);

describe('connectInfiniteHits', () => {
  describe('single index', () => {
    const createSingleIndexContext = () => ({
      mainTargetedIndex: 'index',
    });

    it('provides the current hits to the component', () => {
      const contextValue = createSingleIndexContext();

      const hits = [{}];
      const props = connect.getProvidedProps({ contextValue }, null, {
        results: { hits, page: 0, hitsPerPage: 2, nbPages: 3 },
      });

      expect(props).toEqual({ hits, hasMore: true });
    });

    it('accumulate hits internally', () => {
      const contextValue = createSingleIndexContext();

      const hits = [{}, {}];
      const hits2 = [{}, {}];
      const res1 = connect.getProvidedProps({ contextValue }, null, {
        results: { hits, page: 0, hitsPerPage: 2, nbPages: 3 },
      });

      expect(res1.hits).toEqual(hits);
      expect(res1.hasMore).toBe(true);

      const res2 = connect.getProvidedProps({ contextValue }, null, {
        results: {
          hits: hits2,
          page: 1,
          hitsPerPage: 2,
          nbPages: 3,
        },
      });

      expect(res2.hits).toEqual([...hits, ...hits2]);
      expect(res2.hasMore).toBe(true);
    });

    it('accumulate hits internally while changing hitsPerPage configuration', () => {
      const contextValue = createSingleIndexContext();

      const hits = [{}, {}, {}, {}, {}, {}];
      const hits2 = [{}, {}, {}, {}, {}, {}];
      const hits3 = [{}, {}, {}, {}, {}, {}, {}, {}];

      const res1 = connect.getProvidedProps({ contextValue }, null, {
        results: { hits, page: 0, hitsPerPage: 6, nbPages: 10 },
      });

      expect(res1.hits).toEqual(hits);
      expect(res1.hasMore).toBe(true);

      const res2 = connect.getProvidedProps({ contextValue }, null, {
        results: {
          hits: hits2,
          page: 1,
          hitsPerPage: 6,
          nbPages: 10,
        },
      });

      expect(res2.hits).toEqual([...hits, ...hits2]);
      expect(res2.hasMore).toBe(true);

      let res3 = connect.getProvidedProps({ contextValue }, null, {
        results: {
          hits: hits3,
          page: 2,
          hitsPerPage: 8,
          nbPages: 10,
        },
      });

      expect(res3.hits).toEqual([...hits, ...hits2, ...hits3]);
      expect(res3.hasMore).toBe(true);

      // re-render with the same property
      res3 = connect.getProvidedProps({ contextValue }, null, {
        results: {
          hits: hits3,
          page: 2,
          hitsPerPage: 8,
          nbPages: 10,
        },
      });

      expect(res3.hits).toEqual([...hits, ...hits2, ...hits3]);
      expect(res3.hasMore).toBe(true);
    });

    it('should not reset while accumulating results', () => {
      const contextValue = createSingleIndexContext();

      const hits = [{}, {}];
      const nbPages = 100;

      let allHits = [];
      for (let page = 0; page < nbPages - 1; page++) {
        allHits = [...allHits, ...hits];

        const res = connect.getProvidedProps({ contextValue }, null, {
          results: {
            hits,
            page,
            hitsPerPage: hits.length,
            nbPages,
          },
        });

        expect(res.hits).toEqual(allHits);
        expect(res.hits).toHaveLength((page + 1) * 2);
        expect(res.hasMore).toBe(true);
      }

      allHits = [...allHits, ...hits];

      const res = connect.getProvidedProps({ contextValue }, null, {
        results: {
          hits,
          page: nbPages - 1,
          hitsPerPage: hits.length,
          nbPages,
        },
      });

      expect(res.hits).toHaveLength(nbPages * 2);
      expect(res.hits).toEqual(allHits);
      expect(res.hasMore).toBe(false);
    });

    it('Indicates the last page after several pages', () => {
      const contextValue = createSingleIndexContext();

      const hits = [{}, {}];
      const hits2 = [{}, {}];
      const hits3 = [{}];

      connect.getProvidedProps({ contextValue }, null, {
        results: { hits, page: 0, hitsPerPage: 2, nbPages: 3 },
      });

      connect.getProvidedProps({ contextValue }, null, {
        results: {
          hits: hits2,
          page: 1,
          hitsPerPage: 2,
          nbPages: 3,
        },
      });

      const props = connect.getProvidedProps({ contextValue }, null, {
        results: {
          hits: hits3,
          page: 2,
          hitsPerPage: 2,
          nbPages: 3,
        },
      });

      expect(props.hits).toEqual([...hits, ...hits2, ...hits3]);
      expect(props.hasMore).toBe(false);
    });

    it('adds 1 to page when calling refine', () => {
      const contextValue = createSingleIndexContext();

      const props = { contextValue };
      const state0 = {};

      const state1 = connect.refine(props, state0);
      expect(state1).toEqual({ page: 2 });

      const state2 = connect.refine(props, state1);
      expect(state2).toEqual({ page: 3 });
    });

    it('automatically converts String state to Number', () => {
      const contextValue = createSingleIndexContext();

      const props = { contextValue };
      const state0 = { page: '0' };

      const state1 = connect.refine(props, state0);
      expect(state1).toEqual({ page: 1 });
    });

    it('expect to always return an array of hits', () => {
      const contextValue = createSingleIndexContext();

      const props = { contextValue };
      const searchState = {};

      // Retrieve the results from the cache that's why
      // the page it's not zero on the first render
      const searchResults = {
        results: {
          hits: [{}, {}, {}],
          page: 1,
          nbPages: 3,
        },
      };

      const expectation = {
        hits: [{}, {}, {}],
        hasMore: true,
      };

      const actual = connect.getProvidedProps(
        props,
        searchState,
        searchResults
      );

      expect(actual).toEqual(expectation);
    });
  });

  describe('multi index', () => {
    const contextValue = {
      mainTargetedIndex: 'first',
    };
    const indexContextValue = {
      targetedIndex: 'second',
    };

    it('provides the current hits to the component', () => {
      const hits = [{}];
      const props = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: { second: { hits, page: 0, hitsPerPage: 2, nbPages: 3 } },
        }
      );

      expect(props).toEqual({ hits, hasMore: true });
    });

    it('accumulate hits internally', () => {
      const hits = [{}, {}];
      const hits2 = [{}, {}];

      const res1 = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: { second: { hits, page: 0, hitsPerPage: 2, nbPages: 3 } },
        }
      );

      expect(res1.hits).toEqual(hits);
      expect(res1.hasMore).toBe(true);

      const res2 = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: {
            second: { hits: hits2, page: 1, hitsPerPage: 2, nbPages: 3 },
          },
        }
      );

      expect(res2.hits).toEqual([...hits, ...hits2]);
      expect(res2.hasMore).toBe(true);
    });

    it('accumulate hits internally while changing hitsPerPage configuration', () => {
      const hits = [{}, {}, {}, {}, {}, {}];
      const hits2 = [{}, {}, {}, {}, {}, {}];
      const hits3 = [{}, {}, {}, {}, {}, {}, {}, {}];

      const res1 = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: { second: { hits, page: 0, hitsPerPage: 6, nbPages: 10 } },
        }
      );

      expect(res1.hits).toEqual(hits);
      expect(res1.hasMore).toBe(true);

      const res2 = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: {
            second: { hits: hits2, page: 1, hitsPerPage: 6, nbPages: 10 },
          },
        }
      );

      expect(res2.hits).toEqual([...hits, ...hits2]);
      expect(res2.hasMore).toBe(true);

      let res3 = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: {
            second: { hits: hits3, page: 2, hitsPerPage: 8, nbPages: 10 },
          },
        }
      );

      expect(res3.hits).toEqual([...hits, ...hits2, ...hits3]);
      expect(res3.hasMore).toBe(true);

      // re-render with the same property
      res3 = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: {
            second: { hits: hits3, page: 2, hitsPerPage: 8, nbPages: 10 },
          },
        }
      );

      expect(res3.hits).toEqual([...hits, ...hits2, ...hits3]);
      expect(res3.hasMore).toBe(true);
    });

    it('should not reset while accumulating results', () => {
      const hits = [{}, {}];
      const nbPages = 100;

      let allHits = [];
      for (let page = 0; page < nbPages - 1; page++) {
        allHits = [...allHits, ...hits];

        const res = connect.getProvidedProps(
          { contextValue, indexContextValue },
          null,
          {
            results: {
              second: {
                hits,
                page,
                hitsPerPage: hits.length,
                nbPages,
              },
            },
          }
        );

        expect(res.hits).toEqual(allHits);
        expect(res.hits).toHaveLength((page + 1) * 2);
        expect(res.hasMore).toBe(true);
      }

      allHits = [...allHits, ...hits];

      const res = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: {
            second: {
              hits,
              page: nbPages - 1,
              hitsPerPage: hits.length,
              nbPages,
            },
          },
        }
      );

      expect(res.hits).toHaveLength(nbPages * 2);
      expect(res.hits).toEqual(allHits);
      expect(res.hasMore).toBe(false);
    });

    it('Indicates the last page after several pages', () => {
      const hits = [{}, {}];
      const hits2 = [{}, {}];
      const hits3 = [{}];

      connect.getProvidedProps({ contextValue, indexContextValue }, null, {
        results: { second: { hits, page: 0, hitsPerPage: 2, nbPages: 3 } },
      });

      connect.getProvidedProps({ contextValue, indexContextValue }, null, {
        results: {
          second: { hits: hits2, page: 1, hitsPerPage: 2, nbPages: 3 },
        },
      });

      const props = connect.getProvidedProps(
        { contextValue, indexContextValue },
        null,
        {
          results: {
            second: { hits: hits3, page: 2, hitsPerPage: 2, nbPages: 3 },
          },
        }
      );

      expect(props.hits).toEqual([...hits, ...hits2, ...hits3]);
      expect(props.hasMore).toBe(false);
    });
  });
});
