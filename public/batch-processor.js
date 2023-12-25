export class BatchProcessor {
    constructor(batchSize) {
        this.batchSize = batchSize;
        this.jobQueue = [];
        this.isProcessing = false;
        this.eventTarget = new EventTarget();
    }

    addEventListener(type, callback) {
        this.eventTarget.addEventListener(type, callback);
    }

    dispatchEvent(event) {
        this.eventTarget.dispatchEvent(event);
    }

    async addJob(job, args) {
        this.jobQueue.push([job, args]);
        if (!this.isProcessing) {
            this.isProcessing = true;
            this.dispatchEvent(new Event('stateChange'));
            this.processBatch();
        }
    }

    processBatch() {
        const currentBatch = this.jobQueue.splice(0, this.batchSize);

        if (currentBatch.length > 0) {
            this.isProcessing = true;
            const batchEvent = new CustomEvent('batchStart', { detail: { batch: currentBatch } });
            this.dispatchEvent(batchEvent);

            const processPromises = currentBatch.map(this.processJob);

            Promise.all(processPromises)
                .then(() => {
                    const batchCompleteEvent = new CustomEvent('batchComplete', { detail: { batch: currentBatch } });
                    this.dispatchEvent(batchCompleteEvent);
                    this.dispatchEvent(new Event('stateChange'));
                    this.processBatch(); // Process the next batch asynchronously
                })
                .catch(error => {
                    console.error('Error processing batch:', error);
                    this.dispatchEvent(new Event('stateChange'));
                });
        } else {
            this.isProcessing = false;
            this.dispatchEvent(new Event('stateChange'));
            this.dispatchEvent(new Event('allJobsProcessed'));
            console.log('All jobs processed.');
        }
    }

    async processJob(job) {
        await job[0](...job.splice(1));
    }
}
