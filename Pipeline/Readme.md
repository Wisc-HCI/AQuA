# 🎉 Object Detection Pipeline: Detect Objects in Audio and Video Files

Here's the step-by-step tutorial on running the Object Detection Pipeline:

## Step 1: Installation

1. Create a new Conda environment:
   ```sh
   conda create --name detic python=3.8 -y

2. Activate the Conda environment:
    ```sh
    conda activate detic
3. Install PyTorch, Torchaudio, and Torchvision.
4. Install Detectron2:
    ```sh
    python -m pip install 'git+https://github.com/facebookresearch/detectron2.git'
5. Install Detic:
    ```sh
    cd Pipeline/Detic
    pip install -r requirements.txt
6. Create a models directory and add the required model:
    ```sh
    wget https://dl.fbaipublicfiles.com/detic/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.pth -O models/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.pth
7. Create a directory called media and add the audio and video files to the media directory.
8. Run the script:
    ```sh
    python3 script.py --audio_file <your_audio_file> --video_file <your_video_file>

