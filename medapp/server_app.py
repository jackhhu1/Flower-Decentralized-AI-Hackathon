"""medapp: A Flower / pytorch_msg_api app."""

import torch
import wandb
from flwr.app import ArrayRecord, ConfigRecord, Context, MetricRecord
from flwr.serverapp import Grid, ServerApp
from flwr.serverapp.strategy import FedAvg

from medapp.task import Net, load_centralized_dataset, maybe_init_wandb, test, get_model, get_model_config, enhanced_test, create_confusion_matrix_plot, save_detailed_results

# Create ServerApp
app = ServerApp()


@app.main()
def main(grid: Grid, context: Context) -> None:
    """Main entry point for the ServerApp."""

    # Read run config
    fraction_train: float = context.run_config["fraction-train"]
    num_rounds: int = context.run_config["num-server-rounds"]
    num_classes: int = context.run_config["num-classes"]
    lr: float = context.run_config["lr"]
    data_path = context.node_config[context.run_config["dataset"]]

    # Initialize Weights & Biases if set
    use_wandb = context.run_config["use-wandb"]
    wandbtoken = context.run_config.get("wandb-token")
    maybe_init_wandb(use_wandb, wandbtoken)

    # Get model type from config (default to enhanced_cnn for skin lesion classification)
    model_type = context.run_config.get("model-type", "enhanced_cnn")
    model_config = get_model_config(model_type)
    
    print(f"🚀 Starting federated learning with {model_type} model")
    print(f"📊 Model description: {model_config['description']}")
    print(f"🎯 Dataset: {context.run_config['dataset']} with {num_classes} classes")
    
    # Load global model
    global_model = get_model(model_type, num_classes=num_classes)
    arrays = ArrayRecord(global_model.state_dict())

    # Initialize FedAvg strategy
    strategy = FedAvg(fraction_train=fraction_train)

    # Start strategy, run FedAvg for `num_rounds`
    result = strategy.start(
        grid=grid,
        initial_arrays=arrays,
        train_config=ConfigRecord({
            "lr": model_config["lr"],
            "model-type": model_type,
            "model-description": model_config["description"]
        }),
        num_rounds=num_rounds,
        evaluate_fn=get_global_evaluate_fn(
            num_classes=num_classes,
            use_wandb=use_wandb,
            data_path=data_path,
            model_type=model_type,
            output_dir=context.node_config["output_dir"],
        ),
    )

    # Save final model to disk
    print("\nSaving final model to disk...")
    out_dir = context.node_config["output_dir"]
    state_dict = result.arrays.to_torch_state_dict()
    torch.save(state_dict, f"{out_dir}/final_model.pt")


def get_global_evaluate_fn(num_classes: int, use_wandb: bool, data_path: str, model_type: str, output_dir: str):
    """Return an evaluation function for server-side evaluation."""

    def global_evaluate(server_round: int, arrays: ArrayRecord) -> MetricRecord:
        """Evaluate model on central data."""

        # Load model and set device
        model = get_model(model_type, num_classes=num_classes)
        model.load_state_dict(arrays.to_torch_state_dict())
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        model.to(device)

        # Load entire test set
        test_dataloader = load_centralized_dataset(data_path)

        # Enhanced evaluation with debugging
        eval_results, confidence_analysis, class_distribution = enhanced_test(
            model, test_dataloader, device, model_name=f"{model_type}_Round_{server_round}"
        )
        
        # Save confusion matrix and detailed results
        accuracy = eval_results['accuracy']
        
        # Create confusion matrix plot
        confusion_matrix_path = create_confusion_matrix_plot(
            eval_results, model_type, server_round, accuracy, output_dir
        )
        
        # Save detailed results
        results_path = save_detailed_results(
            eval_results, confidence_analysis, class_distribution,
            model_type, server_round, accuracy, output_dir
        )
        
        metric = {
            "accuracy": float(eval_results['accuracy']), 
            "loss": float(eval_results.get('loss', 0.0)),
            "server_round": int(server_round),
            "avg_confidence": float(confidence_analysis['avg_confidence']),
            "high_conf_accuracy": float(confidence_analysis['high_conf_accuracy'])
        }

        if use_wandb:
            wandb.log(metric, step=server_round)

        return MetricRecord(metric)

    return global_evaluate
