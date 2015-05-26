
import sys, json, os

from utils.parser import Problem

def getActionDetails(task, plan):
    actions = []
    act_map = {}
    
    for a in task.actions:
        act_map[a.name] = a
    
    for act_line in plan:
        a_name = act_line[1:-1].split(' ')[0]
        if len(act_line.split(' ')) > 1:
            a_params = act_line[1:-1].split(' ')[1:]
        else:
            a_params = False
            
        a = act_map[a_name]
        actions.append({'name': act_line, 'action': a.export(grounding=a_params)})
        
    return json.dumps({'result': 'ok',
                       'type': 'full',
                       'length': len(plan),
                       'plan': actions}, indent=4)

def getSimplePlan(task, plan, err_msg):
    return json.dumps({'result': 'ok',
                       'type': 'simple',
                       'length': len(plan),
                       'plan': plan,
                       'error': err_msg}, indent=4)

def doit(domain, problem, solution, outfile):
    
    try:
        file = open(outfile, 'r')
        solver_output = file.read()
        file.close()
    except Exception, e:
        return json.dumps({'result': 'err',
                           'error': "Failed to read solver output -- %s" % str(e)})
    
    try:
        task = Problem(domain, problem)
    except Exception, e:
        return json.dumps({'result': 'err',
                           'error': "Failed to parse the problem -- %s\n\n%s" % (str(e), solver_output)})
    
    try:
        
        if not os.path.isfile(solution):
            return json.dumps({'result': 'err',
                               'error': "Solver failed.\n\n%s" % solver_output})
        
        file = open(solution, 'r')
        plan = map(lambda x: x.strip().lower(), file.readlines())
        file.close()
        
        if (len(plan) == 0) or (len(plan) == 1 and plan[0] == ''):
            err_str = "Suspected timeout.\n\n%s" % solver_output
            return json.dumps({'result': 'err',
                               'error': err_str})
        
        if '' == plan[-1]:
            plan = plan[:-1]
            
    except Exception, e:
        return json.dumps({'result': 'err',
                           'error': "Failed to parse plan -- %s\n\n%s" % (str(e), solver_output)})
    
    try:
        return getActionDetails(task, plan)
    except Exception, e:
        return getSimplePlan(task, plan, str(e))

if __name__ == '__main__':
    
    domain = sys.argv[1]
    problem = sys.argv[2]
    solution = sys.argv[3]
    solverout = sys.argv[4]
    
    print doit(domain, problem, solution, solverout)
