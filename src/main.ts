import * as hybridSummarizer from './HybridSummarizer';
import './style.css'

const API_KEY = 'API_KEY';
const inputTextArea = document.querySelector('#input') as HTMLTextAreaElement;
const summaryTypeSelect = document.querySelector('#type') as HTMLSelectElement;
const summaryFormatSelect = document.querySelector('#format') as HTMLSelectElement;
const summaryLengthSelect = document.querySelector('#length') as HTMLSelectElement;
const summarizeButton = document.getElementById('summarize') as HTMLButtonElement;
const outputTextArea = document.querySelector('#output') as HTMLPreElement;


summarizeButton.addEventListener('click', async () => {
  const summarizer = await hybridSummarizer.create(API_KEY, {
    format: summaryFormatSelect.value as AISummarizerFormat,
    length: summaryLengthSelect.value as AISummarizerLength,
    type: summaryTypeSelect.value as AISummarizerType
  });
  outputTextArea.innerText = '';

  try {
    const stream = summarizer.summarizeStreaming(inputTextArea.value) as any as AsyncIterable<string>;
    for await (const chunk of stream) {
      console.log(chunk);
      outputTextArea.innerText += chunk;
    }
  } catch (error) {
    console.error(error);
  }
});
