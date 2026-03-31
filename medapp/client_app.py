"""medapp: A Flower / pytorch_msg_api app."""

import torch
from flwr.app import ArrayRecord, Context, Message, MetricRecord, RecordDict
from flwr.clientapp import ClientApp

from medapp.task import Net, load_data, get_model, get_model_config
from medapp.task import test as test_fn
from medapp.task import train as train_fn, train_with_class_balancing, train_with_simple_balancing

# Flower ClientApp
app = ClientApp()


@app.train()
def train(msg: Message, context: Context):
    """Train the model on local data."""

    # Get model type from config (default to enhanced_cnn for skin lesion classification)
    model_type = context.run_config.get("model-type", "enhanced_cnn")
    model_config = get_model_config(model_type)
    
    print(f"🔧 Client using {model_type} model: {model_config['description']}")
    
    # Load the model and initialize it with the received weights
    model = get_model(model_type, num_classes=context.run_config["num-classes"])
    model.load_state_dict(msg.content["arrays"].to_torch_state_dict())
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    model.to(device)

    # Load the data
    data_path = context.node_config[context.run_config["dataset"]]
    trainloader, _ = load_data(data_path)

    # Use model-specific learning rate and loss function
    lr = msg.content["config"].get("lr", model_config["lr"])
    use_focal_loss = model_config["use_focal_loss"]
    use_class_balancing = context.run_config.get("use-class-balancing", True)

    # Call the training function with simple class balancing
    if use_class_balancing:
        print(f"🚀 Using simple class balancing to fix majority class prediction issue")
        train_loss = train_with_simple_balancing(
            model,
            trainloader,
            context.run_config["local-epochs"],
            lr,
            device,
            use_focal_loss,
        )
    else:
        train_loss = train_fn(
            model,
            trainloader,
            context.run_config["local-epochs"],
            lr,
            device,
            use_focal_loss,
        )

    # Construct and return reply Message
    model_record = ArrayRecord(model.state_dict())
    metrics = {
        "train_loss": train_loss,
        "num-examples": len(trainloader.dataset),
    }
    metric_record = MetricRecord(metrics)
    content = RecordDict({"arrays": model_record, "metrics": metric_record})
    return Message(content=content, reply_to=msg)


@app.evaluate()
def evaluate(msg: Message, context: Context):
    """Evaluate the model on local data."""

    # Get model type from config (default to enhanced_cnn for skin lesion classification)
    model_type = context.run_config.get("model-type", "enhanced_cnn")
    
    # Load the model and initialize it with the received weights
    model = get_model(model_type, num_classes=context.run_config["num-classes"])
    model.load_state_dict(msg.content["arrays"].to_torch_state_dict())
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    model.to(device)

    # Load the data
    data_path = context.node_config[context.run_config["dataset"]]
    _, valloader = load_data(data_path)

    # Call the evaluation function
    eval_loss, eval_acc = test_fn(
        model,
        valloader,
        device,
    )

    # Construct and return reply Message
    metrics = {
        "eval_loss": eval_loss,
        "eval_acc": eval_acc,
        "num-examples": len(valloader.dataset),
    }
    metric_record = MetricRecord(metrics)
    content = RecordDict({"metrics": metric_record})
    return Message(content=content, reply_to=msg)
