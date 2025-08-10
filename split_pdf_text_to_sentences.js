import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
function generateAlphabet() {
  let alphabet = [];
  for (let i = 0; i < 26; i++) {
    alphabet.push(String.fromCharCode(65 + i) + '.'); // For lowercase
  }
  return alphabet;
}
function isLowerCaseAscii(char) {
  const charCode = char.charCodeAt(0);
  return charCode >= 97 && charCode <= 122; // ASCII range for 'a' to 'z'
}
function isUpperCaseAscii(char) {
  const charCode = char.charCodeAt(0);
  return charCode >= 65 && charCode <= 90; // ASCII range for 'a' to 'z'
}
function concatTwoLines(lineA, lineB) {
  if (!lineA.length || !lineB.length) {
    return lineA.trim() + lineB.trim();
  }
  if (lineA[lineA.length - 1] == '-' && isLowerCaseAscii(lineB[0])) {
    return lineA.slice(0, -1) + lineB;
  }
  if (!lineA[lineA.length - 1] == ' ' && !lineB[0] == ' ') {
    return lineA + ' ' + lineB;
  }
  return lineA + lineB;
}
const pdfToArray = async (pdfPath) => {
  let arrResult = [];
  try {
    let arrItems = [];
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdfDocument = await loadingTask.promise;
    for (let i = 1; i < 20 && i <= pdfDocument.numPages; ++i) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      arrItems = arrItems.concat(textContent.items);
    }
    if (arrItems.length <= 1) {
      console.log('error too few items');
      return [];
    }
    for (let i = 1; i < arrItems.length; ++i) {
      const prev = arrItems[i - 1];
      const next = arrItems[i];
      if (next.width <= 0 || next.height <= 0 || next.str.length <= 0) {
        if (next.hasEOL && !prev.hasEOL) {
          prev.hasEOL = true;
        }
        arrItems.splice(i, 1);
        --i;
        continue;
      }
      next.sameSection = false;
      const minHeight = Math.min(prev.height, next.height);
      const prevY = prev.transform[5];
      const nextY = next.transform[5];
      // console.log(prev);
      // console.log(next);
      if (!prev.hasEOL) {
        next.sameSection = true;
      } else {
        if (prevY < nextY) {
          // not the same page
        } else {
          const gapY = prevY - (nextY + next.height);
          if (gapY > minHeight * 0.618) {
            next.sameSection = false;
          } else {
            next.sameSection = true;
          }
        }
      }
    }

    let arrSections = [];
    let strSection = arrItems[0].str.trim();
    for (let i = 1; i < arrItems.length; ++i) {
      if (arrItems[i].sameSection) {
        strSection = concatTwoLines(strSection, arrItems[i].str.trim());
      } else {
        arrSections.push(strSection);
        strSection = arrItems[i].str.trim();
      }
    }
    if (strSection) {
      arrSections.push(strSection);
      strSection = '';
    }
    for (let section of arrSections) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
      const sentencesFromSegmenter = Array.from(
        segmenter.segment(section),
        (s) => s.segment
      );
      arrResult = arrResult.concat(sentencesFromSegmenter);
    }
    let abbres = generateAlphabet().concat(['Mr.', 'Mrs.', 'Dr.']);
    let endAbbres = ['D.C.'];
    const endsWithAbbr = (str) => {
      for (let end of endAbbres) {
        if (str.trim().endsWith(end)) {
          return false;
        }
      }
      for (let abbr of abbres) {
        if (str.trim().endsWith(abbr)) {
          return true;
        }
      }
      return false;
    };
    for (let i = 0; i < arrResult.length; ++i) {
      if (i < arrResult.length - 1 && endsWithAbbr(arrResult[i])) {
        arrResult[i] = arrResult[i] + ' ' + arrResult[i + 1];
        arrResult.splice(i + 1, 1);
        --i;
      }
    }
  } catch (error) {
    console.log(error);
  }
  return arrResult;
};

const result = await pdfToArray(
  'how-to-win-friends-and-influence-people-1-10.pdf'
  //'Recovering from Emotionally Immature Parents.pdf'
);
for (let sentence of result) {
  console.log(sentence);
  console.log('');
}
// console.log(util.inspect(result, { maxArrayLength: null }));
